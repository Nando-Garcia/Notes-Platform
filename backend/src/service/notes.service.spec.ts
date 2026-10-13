import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { Note } from '../entities/note.entity';
import { SqsProducerService } from '../sqs/sqs-producer.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

const mockNotesRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockSqsProducer = {
  sendFileAttachedEvent: jest.fn().mockResolvedValue(undefined),
};

const mockFile: Express.Multer.File = {
  originalname: 'documento.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('contenido de prueba'),
  fieldname: 'file',
  encoding: '7bit',
  size: 100,
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
};

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSqsProducer.sendFileAttachedEvent.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(Note), useValue: mockNotesRepository },
        { provide: SqsProducerService, useValue: mockSqsProducer },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAllByUser ────────────────────────────────────────────────────────

  describe('findAllByUser', () => {
    it('debería retornar las notas del usuario', async () => {
      const notes = [{ id: 1, title: 'Nota', content: 'Contenido', userId: 1 }];
      mockNotesRepository.find.mockResolvedValue(notes);

      const result = await service.findAllByUser(1);

      expect(result).toEqual(notes);
      expect(mockNotesRepository.find).toHaveBeenCalledWith({ where: { userId: 1 } });
    });

    it('debería retornar mensaje si el usuario no tiene notas', async () => {
      mockNotesRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUser(1);

      expect(result).toEqual({ mensaje: 'no hay mensajes' });
    });

    it('debería propagar el error si el repositorio falla', async () => {
      mockNotesRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAllByUser(1)).rejects.toThrow('DB error');
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('debería crear y retornar una nota exitosamente', async () => {
      const noteData = { title: 'Titulo', content: 'Contenido' };
      const savedNote = { id: 1, ...noteData, userId: 1 };
      mockNotesRepository.create.mockReturnValue({ ...noteData, userId: 1 });
      mockNotesRepository.save.mockResolvedValue(savedNote);

      const result = await service.create(noteData, 1);

      expect(result).toEqual(savedNote);
      expect(mockNotesRepository.create).toHaveBeenCalledWith({ ...noteData, userId: 1 });
      expect(mockNotesRepository.save).toHaveBeenCalled();
    });

    it('debería propagar el error si el guardado en BD falla', async () => {
      mockNotesRepository.create.mockReturnValue({});
      mockNotesRepository.save.mockRejectedValue(new Error('DB save error'));

      await expect(service.create({ title: 'T', content: 'C' }, 1)).rejects.toThrow('DB save error');
    });
  });

  // ─── attachFile ───────────────────────────────────────────────────────────

  describe('attachFile', () => {
    it('debería subir el archivo a S3 y guardar la URL en la nota', async () => {
      const note = { id: 1, userId: 1, title: 'Test', content: 'Content', fileUrl: undefined };
      const savedNote = { ...note, fileUrl: 'http://localhost:4566/notes-attachments/1/1/uuid.pdf' };
      mockNotesRepository.findOne.mockResolvedValue(note);
      mockNotesRepository.save.mockResolvedValue(savedNote);

      const result = await service.attachFile(1, 1, mockFile);

      const s3Send = (service as any).s3Client.send;
      expect(s3Send).toHaveBeenCalled();
      expect(result).toEqual(savedNote);
    });

    it('debería publicar evento FILE_ATTACHED en SQS después de subir', async () => {
      const note = { id: 1, userId: 1, title: 'Test', content: 'Content' };
      mockNotesRepository.findOne.mockResolvedValue(note);
      mockNotesRepository.save.mockResolvedValue({ ...note, fileUrl: 'http://s3/file.pdf' });

      await service.attachFile(1, 1, mockFile);

      // Esperar el fire-and-forget
      await new Promise(r => setTimeout(r, 0));
      expect(mockSqsProducer.sendFileAttachedEvent).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la nota no existe', async () => {
      mockNotesRepository.findOne.mockResolvedValue(null);

      await expect(service.attachFile(99, 1, mockFile)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('debería eliminar una nota sin archivo adjunto', async () => {
      const note = { id: 1, userId: 1, title: 'Test', content: 'Content', fileUrl: null };
      mockNotesRepository.findOne.mockResolvedValue(note);
      mockNotesRepository.remove.mockResolvedValue(note);

      const result = await service.delete(1, 1);

      expect(result).toEqual({ message: 'Nota eliminada correctamente' });
      expect(mockNotesRepository.remove).toHaveBeenCalledWith(note);
    });

    it('debería eliminar el archivo de S3 antes de borrar la nota', async () => {
      const note = {
        id: 1, userId: 1, title: 'Test', content: 'Content',
        fileUrl: 'http://localhost:4566/notes-attachments/1/1/uuid.pdf',
      };
      mockNotesRepository.findOne.mockResolvedValue(note);
      mockNotesRepository.remove.mockResolvedValue(note);

      const result = await service.delete(1, 1);

      const s3Send = (service as any).s3Client.send;
      expect(s3Send).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Nota eliminada correctamente' });
    });

    it('debería eliminar la nota aunque falle S3 (archivo huérfano aceptable)', async () => {
      const note = {
        id: 1, userId: 1,
        fileUrl: 'http://localhost:4566/notes-attachments/1/1/uuid.pdf',
      };
      mockNotesRepository.findOne.mockResolvedValue(note);
      mockNotesRepository.remove.mockResolvedValue(note);

      const s3Send = (service as any).s3Client.send;
      s3Send.mockRejectedValue(new Error('S3 unavailable'));

      const result = await service.delete(1, 1);

      expect(result).toEqual({ message: 'Nota eliminada correctamente' });
      expect(mockNotesRepository.remove).toHaveBeenCalledWith(note);
    });

    it('debería lanzar NotFoundException si la nota no pertenece al usuario', async () => {
      mockNotesRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(99, 1)).rejects.toThrow(NotFoundException);
      expect(mockNotesRepository.remove).not.toHaveBeenCalled();
    });
  });
});
