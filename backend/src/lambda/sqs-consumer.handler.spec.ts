import { handler } from './sqs-consumer.handler';

jest.mock('./lambda-sqs-consumer.service', () => ({
  LambdaSqsConsumerService: jest.fn().mockImplementation(() => ({
    processRecords: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

const makeEvent = (records: any[]) => ({ Records: records });

const validRecord = {
  body: JSON.stringify({
    event: 'FILE_ATTACHED',
    noteId: 1,
    userId: 1,
    fileUrl: 'http://s3/file.pdf',
  }),
  messageId: 'msg-1',
};

describe('sqs-consumer handler', () => {
  it('debería retornar statusCode 200 con records válidos', async () => {
    const result = await handler(makeEvent([validRecord]));

    expect(result).toEqual({ statusCode: 200 });
  });

  it('debería retornar statusCode 200 si no hay Records en el evento', async () => {
    const result = await handler({});

    expect(result).toEqual({ statusCode: 200 });
  });

  it('debería retornar statusCode 200 si Records es un array vacío', async () => {
    const result = await handler(makeEvent([]));

    expect(result).toEqual({ statusCode: 200 });
  });

  it('debería propagar el error para que Lambda reintente via SQS', async () => {
    const { LambdaSqsConsumerService } = require('./lambda-sqs-consumer.service');
    const instance = LambdaSqsConsumerService.mock.results[0].value;
    instance.processRecords.mockRejectedValueOnce(new Error('processing failed'));

    await expect(handler(makeEvent([validRecord]))).rejects.toThrow('processing failed');
  });
});
