import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from '../service/notes.service';
import { Note } from '../entities/note.entity';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), SqsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
