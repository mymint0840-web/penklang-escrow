import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '@/utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
  };
  stack?: string;
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Default error response
  let statusCode = 500;
  let message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  let code: string | undefined;
  let details: any;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'ข้อมูลไม่ถูกต้อง';
    code = 'VALIDATION_ERROR';
    details = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    code = err.code;

    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.[0] || 'field';
        message = `${field === 'email' ? 'อีเมล' : field === 'phone' ? 'หมายเลขโทรศัพท์' : field}นี้ถูกใช้งานแล้ว`;
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        // Record not found
        message = 'ไม่พบข้อมูลที่ต้องการ';
        code = 'NOT_FOUND';
        statusCode = 404;
        break;
      case 'P2003':
        // Foreign key constraint violation
        message = 'ข้อมูลที่เกี่ยวข้องไม่ถูกต้อง';
        code = 'INVALID_REFERENCE';
        break;
      case 'P2014':
        // Relation violation
        message = 'ไม่สามารถดำเนินการได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง';
        code = 'RELATION_VIOLATION';
        break;
      default:
        message = 'เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล';
        code = 'DATABASE_ERROR';
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'ข้อมูลที่ส่งมาไม่ถูกต้อง';
    code = 'VALIDATION_ERROR';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'โทเค็นไม่ถูกต้อง';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'โทเค็นหมดอายุแล้ว';
    code = 'TOKEN_EXPIRED';
  }
  // Handle generic errors
  else if (err instanceof Error) {
    // Check for specific error messages
    if (err.message.includes('CORS')) {
      statusCode = 403;
      message = 'การเข้าถึงถูกปิดกั้นโดย CORS policy';
      code = 'CORS_ERROR';
    } else if (err.message.includes('ECONNREFUSED')) {
      message = 'ไม่สามารถเชื่อมต่อกับบริการได้';
      code = 'CONNECTION_ERROR';
    }
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      ...(details && { details }),
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `ไม่พบเส้นทาง ${req.method} ${req.path}`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
};

// Async handler wrapper to catch errors in async functions
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
