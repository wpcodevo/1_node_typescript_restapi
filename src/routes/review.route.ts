import express from 'express';
import { restrictTo } from '../controller/auth.controller';
import {
  addTourAndUser,
  createReviewHandler,
  deleteReviewHandler,
  getAllReviewsHandler,
  getReviewHandler,
  updateReviewHandler,
} from '../controller/review.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import requireUser from '../middleware/requireUser';
import validate from '../middleware/validateResource';
import {
  createReviewSchema,
  deleteReviewSchema,
  getReviewSchema,
  updateReviewSchema,
} from '../schema/review.schema';

const router = express.Router({ mergeParams: true });

router.use(deserializeUser, requireUser);

router
  .route('/')
  .get(getAllReviewsHandler)
  .post(
    addTourAndUser,
    validate(createReviewSchema),
    restrictTo('user'),
    createReviewHandler
  );

router
  .route('/:reviewId')
  .get(validate(getReviewSchema), getReviewHandler)
  .patch(
    restrictTo('admin', 'user'),
    validate(updateReviewSchema),
    updateReviewHandler
  )
  .delete(
    restrictTo('admin', 'user'),
    validate(deleteReviewSchema),
    deleteReviewHandler
  );

export default router;
