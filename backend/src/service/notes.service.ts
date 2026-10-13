import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../entities/note.entity';
import { SqsProducerService } from '../sqs/sqs-producer.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { createLogger } from '../common/logger';

@Injectable()
export class NotesService {
  private readonly logger = createLogger(NotesService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
    private readonly sqsProducer: SqsProducerService,
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.LOCALSTACK_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID) as string,
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY) as string,
      },
    });
    this.bucketName = process.env.S3_BUCKET as string;
  }

  async findAllByUser(userId: number): Promise<Note[] | { mensaje: string }> {
    try {
      this.logger.info(`[NOTES_FIND_START] userId=${userId}`, {
        context: 'NotesService.findAllByUser',
        userId,
      });

      const notes = await this.notesRepository.find({ where: { userId } });

      if (notes.length === 0) {
        this.logger.warn(`[NOTES_FIND_EMPTY] userId=${userId}`, {
          context: 'NotesService.findAllByUser',
          userId,
        });
        return { mensaje: 'no hay mensajes' };
      }

      this.logger.info(`[NOTES_FIND_SUCCESS] userId=${userId}, count=${notes.length}`, {
        context: 'NotesService.findAllByUser',
        userId,
        count: notes.length,
      });

      return notes;
    } catch (error: any) {
      this.logger.error(`[NOTES_FIND_FAILED] userId=${userId}`, {
        context: 'NotesService.findAllByUser',
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  async create(note: { title: string; content: string }, userId: number): Promise<Note> {
    try {
      this.logger.info(`[NOTE_CREATE_START] userId=${userId}, titleLength=${note.title.length}`, {
        context: 'NotesService.create',
        userId,
        titleLength: note.title.length,
      });

      const newNote = this.notesRepository.create({ ...note, userId });
      const savedNote = await this.notesRepository.save(newNote);

      this.logger.info(`[NOTE_CREATE_SUCCESS] noteId=${savedNote.id}, userId=${userId}`, {
        context: 'NotesService.create',
        userId,
        noteId: savedNote.id,
      });

      return savedNote;
    } catch (error: any) {
      this.logger.error(`[NOTE_CREATE_FAILED] userId=${userId}`, {
        context: 'NotesService.create',
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async attachFile(noteId: number, userId: number, file: Express.Multer.File): Promise<Note> {
    const note = await this.notesRepository.findOne({ where: { id: noteId, userId } });
    if (!note) {
      throw new NotFoundException(`Note ${noteId} not found for user ${userId}`);
    }

    const ext = file.originalname.split('.').pop();
    const key = `${userId}/${noteId}/${randomUUID()}.${ext}`;

    this.logger.info(`[S3_UPLOAD_START] noteId=${noteId}, key=${key}`);

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const fileUrl = `${process.env.LOCALSTACK_ENDPOINT}/${this.bucketName}/${key}`;
    this.logger.info(`[S3_UPLOAD_SUCCESS] noteId=${noteId}, fileUrl=${fileUrl}`);

    note.fileUrl = fileUrl;
    const updated = await this.notesRepository.save(note);

    // Fire & forget: Lambda procesa el evento de forma asíncrona
    this.sqsProducer.sendFileAttachedEvent(noteId, userId, fileUrl)
      .catch(err => this.logger.error('[SQS_SEND_FAILED] noteId=' + noteId, err));

    return updated;
  }

  async delete(noteId: number, userId: number): Promise<{ message: string }> {
    try {
      this.logger.info(`[NOTE_DELETE_START] noteId=${noteId}, userId=${userId}`);

      const note = await this.notesRepository.findOne({ where: { id: noteId, userId } });
      if (!note) {
        throw new NotFoundException(`Note ${noteId} not found for user ${userId}`);
      }

      // Si existe archivo adjunto, intentar borrarlo de S3
      if (note.fileUrl) {
        try {
          // Extraer la key del S3 desde la URL
          // URL formato: http://localhost:4566/notes-attachments/userId/noteId/uuid.ext
          const urlParts = note.fileUrl.split('/');
          const key = `${urlParts[urlParts.length - 3]}/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;

          this.logger.info(`[S3_DELETE_START] noteId=${noteId}, key=${key}`);
          
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }));

          this.logger.info(`[S3_DELETE_SUCCESS] noteId=${noteId}, key=${key}`);
        } catch (s3Error: any) {
          // Loguear pero continuar — el archivo S3 queda huérfano, pero la nota se borra de BD
          this.logger.warn(`[S3_DELETE_FAILED] noteId=${noteId}, fileUrl=${note.fileUrl}`, {
            context: 'NotesService.delete',
            error: s3Error.message,
          });
        }
      }

      // Eliminar nota de BD
      await this.notesRepository.remove(note);

      this.logger.info(`[NOTE_DELETE_SUCCESS] noteId=${noteId}, userId=${userId}`);

      return { message: 'Nota eliminada correctamente' };
    } catch (error: any) {
      this.logger.error(`[NOTE_DELETE_FAILED] noteId=${noteId}, userId=${userId}`, {
        context: 'NotesService.delete',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
