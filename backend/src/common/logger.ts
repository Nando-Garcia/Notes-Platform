import * as winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

export const createLogger = (serviceName: string = 'app') => {
  const transports: winston.transport[] = [
    // Siempre a consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({level, message, timestamp, ...meta}) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}] ${message} ${metaStr}`;
        }),
      ),
    }),
  ];

  // CloudWatch si está habilitado (tanto en desarrollo como producción)
  const useCloudWatch = process.env.USE_CLOUDWATCH === 'true';
  
  if (useCloudWatch && 
      process.env.CLOUDWATCH_LOG_GROUP &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      transports.push(
        new WinstonCloudWatch({
          logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
          logStreamName: `${serviceName}-${process.env.NODE_ENV || 'development'}-${Date.now()}`,
          awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
          awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
          awsRegion: (process.env.AWS_REGION || 'us-east-1') as string,
          messageFormatter: ({level, message, meta}) =>
            JSON.stringify({
              level,
              message,
              service: serviceName,
              timestamp: new Date().toISOString(),
              ...meta,
            }),
        }),
      );
      console.log('[Logger] CloudWatch habilitado para', serviceName);
    } catch (error) {
      console.warn('[Logger] No se pudo conectar a CloudWatch:', error.message);
    }
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
    },
    transports,
    exceptionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ],
  });
};
