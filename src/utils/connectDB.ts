import config from 'config';
import mongoose from 'mongoose';
import log from './logger';

const DB_URI = config
  .get<string>('dbUri')
  .replace('<password>', config.get<string>('dbPass'));

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    log.info('Database connected successfully...');
  } catch (err: any) {
    log.error(err);
  }
};

export default connectDB;
