require('dotenv').config({ path: `${__dirname}/../.env` });
import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import morgan from 'morgan';
import log from './utils/logger';
import connectDB from './utils/connectDB';
import tourRouter from './routes/tour.route';
import userRouter from './routes/user.route';
import sessionRouter from './routes/session.route';
import reviewRouter from './routes/review.route';
import AppError from './utils/appError';
import errorHandler from './controller/error.controller';

const app = express();
app.set('view engine', 'pug');
app.set('views', `${__dirname}/../views`);

// MIDDLEWARE
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/reviews', reviewRouter);

// UNHANDLED ROUTE
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ERROR HANDLER
app.use(errorHandler);

const port = config.get<number>('port');
app.listen(port, () => {
  log.info(`Server started in ${process.env.NODE_ENV} mode on port: ${port}`);

  // CONNECT DB
  connectDB();
});
