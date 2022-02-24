import express from 'express';
import {
  createSessionHandler,
  deleteSessionHandler,
  findAllSessionHandler,
} from '../controller/auth.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import requireUser from '../middleware/requireUser';
import validate from '../middleware/validateResource';
import { createSessionSchema } from '../schema/session.schema';

const router = express.Router();

router
  .route('/')
  .post(validate(createSessionSchema), createSessionHandler)
  .get(deserializeUser, requireUser, findAllSessionHandler)
  .delete(deserializeUser, requireUser, deleteSessionHandler);

export default router;
