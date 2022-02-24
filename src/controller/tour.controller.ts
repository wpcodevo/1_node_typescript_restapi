import { Request, Express, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import tourModel from '../model/tour.model';
import {
  CreateTourInput,
  DeleteTourInput,
  GetAllToursInput,
  GetTourInput,
  UpdateTourInput,
} from '../schema/tour.schema';
import {
  createTour,
  deleteTour,
  getTour,
  updateTour,
} from '../service/tour.service';
import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';
import { promise } from 'zod';

const multerStorage = multer.memoryStorage();
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(new Error('Only images are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.tourId}-${Date.now()}-cover.jpeg`;
  // Resize imageCover
  await sharp(req?.files?.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`${__dirname}/../../public/tours/${req.body.imageCover}`);

  // resize images
  req.body.images = [];

  await Promise.all(
    req?.files?.images.map(async (file, i) => {
      const filename = `tour-${req.params.tourId}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`${__dirname}/../../public/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
};

export const createTourHandler = async (
  req: Request<{}, {}, CreateTourInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tour = await createTour(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'Tour with that name already exist',
      });
    }
    next(err);
  }
};

export const getAllToursHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiFeatures = new APIFeatures(tourModel.find(), req.query)
      .filter()
      .sort()
      .limitField()
      .paginate();

    const tours = await apiFeatures.query;

    res.status(200).json({
      status: 'success',
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const getTourHandler = async (
  req: Request<GetTourInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tour = await getTour({ _id: req.params.tourId });

    if (!tour) {
      return next(new AppError('No document with that ID exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateTourHandler = async (
  req: Request<UpdateTourInput['params'], {}, UpdateTourInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tour = await updateTour({ _id: req.params.tourId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tour) {
      return next(new AppError('No document with that ID exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteTourHandler = async (
  req: Request<DeleteTourInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tour = await deleteTour({ _id: req.params.tourId });

    if (!tour) {
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

export const getTourStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tourStats = await tourModel.aggregate([
      {
        $match: { ratingsAverage: { $lt: 5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTour: { $sum: 1 },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        tourStats,
      },
    });
  } catch (err: any) {
    next(err);
  }
};
