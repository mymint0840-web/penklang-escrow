import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler.middleware';

/**
 * Validation middleware using Zod schemas
 * Validates request body, query, and params
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      // Pass Zod validation errors to error handler
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};

/**
 * Validate only request body
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};

/**
 * Validate only query parameters
 */
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};

/**
 * Validate only route parameters
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};
