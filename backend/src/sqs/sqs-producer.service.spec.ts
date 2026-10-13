import { Test, TestingModule } from '@nestjs/testing';
import { SqsProducerService } from './sqs-producer.service';

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' }),
  })),
  SendMessageCommand: jest.fn().mockImplementation((input) => input),
}));

const SQS_CONFIG = {
  queueUrl: 'http://localhost:4566/000000000000/notes-queue',
  dlqUrl: 'http://localhost:4566/000000000000/notes-dlq',
  region: 'us-east-1',
};

describe('SqsProducerService', () => {
  let service: SqsProducerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsProducerService,
        { provide: 'SQS_CONFIG', useValue: SQS_CONFIG },
      ],
    }).compile();

    service = module.get<SqsProducerService>(SqsProducerService);

    // Restaurar resolución exitosa tras clearAllMocks
    const sqsSend = (service as any).client.send as jest.Mock;
    sqsSend.mockResolvedValue({ MessageId: 'test-message-id' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── sendFileAttachedEvent ────────────────────────────────────────────────

  describe('sendFileAttachedEvent', () => {
    it('debería publicar el evento FILE_ATTACHED en SQS exitosamente', async () => {
      const sqsSend = (service as any).client.send as jest.Mock;

      await expect(
        service.sendFileAttachedEvent(1, 1, 'http://s3/bucket/1/1/uuid.pdf'),
      ).resolves.not.toThrow();

      expect(sqsSend).toHaveBeenCalledTimes(1);
    });

    it('debería llamar a SQS con el QueueUrl correcto', async () => {
      const sqsSend = (service as any).client.send as jest.Mock;

      await service.sendFileAttachedEvent(2, 3, 'http://s3/file.pdf');

      const callArg = sqsSend.mock.calls[0][0];
      expect(callArg.QueueUrl).toBe(SQS_CONFIG.queueUrl);
    });

    it('debería incluir noteId, userId y fileUrl en el mensaje', async () => {
      const sqsSend = (service as any).client.send as jest.Mock;

      await service.sendFileAttachedEvent(5, 7, 'http://s3/archivo.png');

      const callArg = sqsSend.mock.calls[0][0];
      const body = JSON.parse(callArg.MessageBody);
      expect(body.event).toBe('FILE_ATTACHED');
      expect(body.noteId).toBe(5);
      expect(body.userId).toBe(7);
      expect(body.fileUrl).toBe('http://s3/archivo.png');
    });

    it('debería propagar el error si SQS no está disponible', async () => {
      const sqsSend = (service as any).client.send as jest.Mock;
      sqsSend.mockRejectedValue(new Error('SQS connection refused'));

      await expect(
        service.sendFileAttachedEvent(1, 1, 'http://s3/file.pdf'),
      ).rejects.toThrow('SQS connection refused');
    });
  });
});
