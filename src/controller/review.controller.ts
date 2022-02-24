import { NextFunction, Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import reviewModel, { Review } from '../model/review.model';
import {
  CreateReviewInput,
  DeleteReviewInput,
  GetReviewInput,
  UpdateReviewInput,
} from '../schema/review.schema';
import {
  createReview,
  deleteReview,
  getReview,
  updateReview,
} from '../service/review.service';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';

export const createReviewHandler = async (
  req: Request<{}, {}, CreateReviewInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await createReview(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'You can only write one review on a tour',
      });
    }
    next(err);
  }
};

export const getAllReviewsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {} as FilterQuery<Review>;
    if (req.params.tourId) filter.tour = req.params.tourId;
    const apiFeatures = new APIFeatures(reviewModel.find(filter), req.query)
      .filter()
      .sort()
      .limitField()
      .paginate();

    const reviews = await apiFeatures.query;

    res.status(200).json({
      status: 'success',
      result: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const addTourAndUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.tour || req.body.user) return next();

  req.body.tour = req.params.tourId;
  req.body.user = res.locals.user._id;

  next();
};

export const updateReviewHandler = async (
  req: Request<UpdateReviewInput['params'], {}, UpdateReviewInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await updateReview({ _id: req.params.reviewId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      return next(new AppError('No document with that ID exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const getReviewHandler = async (
  req: Request<GetReviewInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await getReview({ _id: req.params.reviewId });

    if (!review) {
      return next(new AppError('No document with that ID exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteReviewHandler = async (
  req: Request<DeleteReviewInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const review = await deleteReview({ _id: req.params.reviewId });

    if (!review) {
      return next(new AppError('No document with that ID exist', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};
