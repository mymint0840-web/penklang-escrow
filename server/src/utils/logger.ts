import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Filter out error stack from meta if it's already in message
      const filteredMeta = { ...meta };
      if (filteredMeta.stack && info.stack) {
        delete filteredMeta.stack;
      }

      if (Object.keys(filteredMeta).length > 0) {
        logMessage += ` ${JSON.stringify(filteredMeta, null, 2)}`;
      }
    }

    return logMessage;
  })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      const filteredMeta = { ...meta };
      if (filteredMeta.stack && info.stack) {
        delete filteredMeta.stack;
      }

      if (Object.keys(filteredMeta).length > 0) {
        logMessage += `\n${JSON.stringify(filteredMeta, null, 2)}`;
      }
    }

    // Add stack trace if present
    if (info.stack) {
      logMessage += `\n${info.stack}`;
    }

    return logMessage;
  })
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development' ? consoleFormat : format,
  }),

  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan middleware
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
