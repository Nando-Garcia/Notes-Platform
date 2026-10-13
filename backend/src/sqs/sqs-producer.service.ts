import { Injectable, Inject } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { createLogger } from '../common/logger';

interface SqsConfig {
  queueUrl: string;
  dlqUrl: string;
  region: string;
}

@Injectable()
export class SqsProducerService {
  private readonly client: SQSClient;
  private readonly logger = createLogger(SqsProducerService.name);

  constructor(@Inject('SQS_CONFIG') private readonly sqsConfig: SqsConfig) {
    this.client = new SQSClient({
      region: sqsConfig.region,
      endpoint: (process.env.LOCALSTACK_ENDPOINT) as string,
      credentials: {
        //accessKeyId: 'test',
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID) as string,
        //secretAccessKey: 'test',
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY) as string,
      },
    });
  }

  async sendFileAttachedEvent(noteId: number, userId: number, fileUrl: string): Promise<void> {
    try {
      const message = {
        event: 'FILE_ATTACHED',
        noteId,
        userId,
        fileUrl,
        timestamp: new Date().toISOString(),
      };

      this.logger.info(`[SQS_MESSAGE_SEND_START] noteId=${noteId}, userId=${userId}`, {
        context: 'SqsProducerService.sendFileAttachedEvent',
        noteId,
        userId,
        event: message.event,
      });

      const command = new SendMessageCommand({
        QueueUrl: this.sqsConfig.queueUrl,
        MessageBody: JSON.stringify(message),
      });

      const result = await this.client.send(command);

      this.logger.info(
        `[SQS_MESSAGE_SENT] Mensaje enviado correctamente`,
        {
          context: 'SqsProducerService.sendFileAttachedEvent',
          messageId: result.MessageId,
          noteId,
          userId,
          fileUrl,
          timestamp: message.timestamp,
        },
      );
    } catch (error: any) {
      this.logger.error(
        `[SQS_MESSAGE_SEND_FAILED] Error enviando mensaje a SQS`,
        {
          context: 'SqsProducerService.sendFileAttachedEvent',
          noteId,
          userId,
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }
}
