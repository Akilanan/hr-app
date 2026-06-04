import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Error type that carries an HTTP status code through to the error handler. */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Wraps an async route handler so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export interface PageParams {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

export function getPagination(
  query: Record<string, unknown>,
  defaultSize = 20,
  maxSize = 100,
): PageParams {
  let page = Number.parseInt(String(query.page ?? ''), 10);
  let pageSize = Number.parseInt(String(query.pageSize ?? ''), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = defaultSize;
  if (pageSize > maxSize) pageSize = maxSize;
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function paginated<T>(data: T[], total: number, p: PageParams) {
  return {
    data,
    pagination: {
      page: p.page,
      pageSize: p.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.pageSize)),
    },
  };
}
