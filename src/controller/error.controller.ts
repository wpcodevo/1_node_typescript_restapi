import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import log from '../utils/logger';

const handleCastError = (err: any) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 404);

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    log.error(err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

export default (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastError(error);
    sendErrorProd(error, res);
  }
};
