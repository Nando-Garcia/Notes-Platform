import { LambdaSqsConsumerService } from './lambda-sqs-consumer.service';

describe('LambdaSqsConsumerService', () => {
  let service: LambdaSqsConsumerService;

  beforeEach(() => {
    service = new LambdaSqsConsumerService();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── processRecords ───────────────────────────────────────────────────────

  describe('processRecords', () => {
    it('debería procesar todos los records correctamente', async () => {
      const records = [
        { body: JSON.stringify({ event: 'FILE_ATTACHED', noteId: 1, userId: 1, fileUrl: 'http://s3/file.pdf' }), messageId: 'msg-1' },
        { body: JSON.stringify({ event: 'FILE_ATTACHED', noteId: 2, userId: 1, fileUrl: 'http://s3/file2.pdf' }), messageId: 'msg-2' },
      ];

      await expect(service.processRecords(records)).resolves.not.toThrow();
    });

    it('debería lanzar error si el body del record no es JSON válido', async () => {
      const records = [{ body: 'invalid json', messageId: 'msg-bad' }];

      await expect(service.processRecords(records)).rejects.toThrow();
    });
  });

  // ─── processMessage ───────────────────────────────────────────────────────

  describe('processMessage', () => {
    it('debería procesar un evento FILE_ATTACHED sin errores', async () => {
      const body = {
        event: 'FILE_ATTACHED',
        noteId: 1,
        userId: 1,
        fileUrl: 'http://s3/bucket/1/1/uuid.pdf',
        timestamp: new Date().toISOString(),
      };

      await expect(service.processMessage(body, 'msg-1')).resolves.not.toThrow();
    });

    it('debería manejar eventos desconocidos sin lanzar error', async () => {
      const body = { event: 'UNKNOWN_EVENT', data: {} };

      await expect(service.processMessage(body, 'msg-unknown')).resolves.not.toThrow();
    });

    it('debería funcionar sin messageId (parámetro opcional)', async () => {
      const body = { event: 'FILE_ATTACHED', noteId: 3, userId: 2, fileUrl: 'http://s3/file.png' };

      await expect(service.processMessage(body)).resolves.not.toThrow();
    });
  });
});
