import express from 'express';
import { restrictTo } from '../controller/auth.controller';
import {
  createTourHandler,
  deleteTourHandler,
  getAllToursHandler,
  getTourHandler,
  getTourStats,
  resizeTourImages,
  updateTourHandler,
  uploadTourImages,
} from '../controller/tour.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import requireUser from '../middleware/requireUser';
import validate from '../middleware/validateResource';
import {
  createTourSchema,
  deleteTourSchema,
  getAllToursSchema,
  getTourSchema,
  updateTourSchema,
} from '../schema/tour.schema';
import reviewRouter from './review.route';

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.get('/tour-stats', getTourStats);

router
  .route('/')
  .post(
    deserializeUser,
    restrictTo('admin'),
    validate(createTourSchema),
    uploadTourImages,
    resizeTourImages,
    createTourHandler
  )
  .get(validate(getAllToursSchema), getAllToursHandler);

router.use(deserializeUser, requireUser);

router
  .route('/:tourId')
  .get(validate(getTourSchema), getTourHandler)
  .patch(
    restrictTo('admin'),
    validate(updateTourSchema),
    uploadTourImages,
    resizeTourImages,
    updateTourHandler
  )
  .delete(restrictTo('admin'), validate(deleteTourSchema), deleteTourHandler);

export default router;
