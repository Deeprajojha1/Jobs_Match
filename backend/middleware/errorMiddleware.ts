import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  // A consistent error envelope makes frontend handling predictable and avoids
  // leaking stack traces in production responses.
  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
};
