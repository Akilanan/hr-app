import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

/** Validates and normalizes req.body against a Zod schema. */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
