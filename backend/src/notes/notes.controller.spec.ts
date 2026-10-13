import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from '../service/notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

const mockNotesService = {
  findAllByUser: jest.fn(),
  create: jest.fn(),
  attachFile: jest.fn(),
  delete: jest.fn(),
};

const mockReq = {
  user: { userId: 1, username: 'testuser' },
} as unknown as AuthenticatedRequest;

describe('NotesController', () => {
  let controller: NotesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        { provide: NotesService, useValue: mockNotesService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotesController>(NotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getNotes ─────────────────────────────────────────────────────────────

  describe('getNotes', () => {
    it('debería delegar a findAllByUser con el userId del token', async () => {
      const notes = [{ id: 1, title: 'Nota', content: 'Contenido', userId: 1 }];
      mockNotesService.findAllByUser.mockResolvedValue(notes);

      const result = await controller.getNotes(mockReq);

      expect(result).toEqual(notes);
      expect(mockNotesService.findAllByUser).toHaveBeenCalledWith(1);
    });

    it('debería retornar mensaje cuando no hay notas', async () => {
      mockNotesService.findAllByUser.mockResolvedValue({ mensaje: 'no hay mensajes' });

      const result = await controller.getNotes(mockReq);

      expect(result).toEqual({ mensaje: 'no hay mensajes' });
    });
  });

  // ─── createNote ───────────────────────────────────────────────────────────

  describe('createNote', () => {
    it('debería crear una nota y retornarla', async () => {
      const dto = { title: 'Titulo', content: 'Contenido' };
      const createdNote = { id: 1, ...dto, userId: 1 };
      mockNotesService.create.mockResolvedValue(createdNote);

      const result = await controller.createNote(dto, mockReq);

      expect(result).toEqual(createdNote);
      expect(mockNotesService.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  // ─── attachFile ───────────────────────────────────────────────────────────

  describe('attachFile', () => {
    it('debería delegar a attachFile con los parámetros correctos', async () => {
      const file = { originalname: 'test.pdf', buffer: Buffer.from('') } as Express.Multer.File;
      const updatedNote = { id: 1, userId: 1, fileUrl: 'http://s3/bucket/key' };
      mockNotesService.attachFile.mockResolvedValue(updatedNote);

      const result = await controller.attachFile(1, file, mockReq);

      expect(result).toEqual(updatedNote);
      expect(mockNotesService.attachFile).toHaveBeenCalledWith(1, 1, file);
    });
  });

  // ─── deleteNote ───────────────────────────────────────────────────────────

  describe('deleteNote', () => {
    it('debería eliminar la nota y retornar el mensaje del servicio', async () => {
      mockNotesService.delete.mockResolvedValue({ message: 'Nota eliminada correctamente' });

      const result = await controller.deleteNote(1, mockReq);

      expect(result).toEqual({ message: 'Nota eliminada correctamente' });
      expect(mockNotesService.delete).toHaveBeenCalledWith(1, 1);
    });
  });
});
