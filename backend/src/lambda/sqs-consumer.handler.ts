import { LambdaSqsConsumerService } from './lambda-sqs-consumer.service';

// Simple Lambda handler for SQS events. Keeps logic minimal so it's easy to test.
const service = new LambdaSqsConsumerService();

export const handler = async (event: any) => {
  console.log('Lambda handler invoked with event:', JSON.stringify(event));

  if (!event.Records || !Array.isArray(event.Records)) {
    console.warn('No records to process');
    return { statusCode: 200 };
  }

  try {
    await service.processRecords(event.Records);
    return { statusCode: 200 };
  } catch (err: any) {
    console.error('Error processing records in lambda handler', err);
    // Let Lambda re-try according to its configuration / SQS redrive
    throw err;
  }
};
