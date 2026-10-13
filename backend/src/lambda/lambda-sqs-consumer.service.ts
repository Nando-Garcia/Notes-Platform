export class LambdaSqsConsumerService {
  constructor() {}

  async processRecords(records: any[]) {
    for (const record of records) {
      try {
        const body = JSON.parse(record.body);
        await this.processMessage(body, record.messageId || record.MessageId);
      } catch (err) {
        console.error('Error parsing record body', err);
        throw err;
      }
    }
  }

  async processMessage(body: any, messageId?: string) {
    console.log('[LAMBDA_PROCESS_MESSAGE] start', { messageId, body });

    if (body.event === 'FILE_ATTACHED') {
      console.log('[LAMBDA] FILE_ATTACHED received', {
        noteId: body.noteId,
        userId: body.userId,
        fileUrl: body.fileUrl,
        timestamp: body.timestamp,
      });

      // Async post-processing simulation:
      // In production this could trigger thumbnail generation,
      // virus scanning, metadata indexing, or push notifications.
      console.log('[LAMBDA] Simulating async post-processing for file:', body.fileUrl);
      console.log('[LAMBDA] FILE_ATTACHED processing complete for noteId=', body.noteId);
    } else {
      console.log('[LAMBDA] Unknown event type', body.event);
    }

    console.log('[LAMBDA_PROCESS_MESSAGE] done', { messageId });
  }
}
