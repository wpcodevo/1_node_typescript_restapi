import { Express, NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import { omit } from 'lodash';
import { User } from '../model/user.model';
import { UpdateMeInput } from '../schema/user.schema';
import { findAndUpdateUser } from '../service/user.service';
import AppError from '../utils/appError';
import { excludedFields } from './auth.controller';

interface CustomRequest<T> extends Request<{}, {}, UpdateMeInput> {
  body: T;
}

type filterFields = {
  firstName: string;
  lastName: string;
  photo: string;
  email: string;
};

function filterObj(obj: CustomRequest<User>, ...allowedFields: string[]) {
  const newObj = {} as filterFields;
  Object.keys(obj).forEach((el: string) => {
    if (allowedFields.includes(el)) {
      // @ts-ignore
      newObj[el] = obj[el];
    }
  });

  return newObj;
}

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(new Error('Only images are allowed'));
  } else {
    cb(null, true);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) return next();

    req.body.filename = `user-${res.locals.user._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`${__dirname}/../../public/users/${req.body.filename}`);

    next();
  } catch (err: any) {
    console.log(err);
    next(err);
  }
};

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user POSTed password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password update, please use /updatePassword',
          403
        )
      );
    }

    const filter = filterObj(req.body, 'firstName', 'lastName', 'email');

    if (req.body.filename) filter.photo = req.body.filename;
    const user = await findAndUpdateUser({ _id: res.locals.user._id }, filter, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError('User no logger exist', 404));
    }

    const newUser = omit(user.toJSON(), excludedFields);

    res.status(200).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await findAndUpdateUser(
      { _id: res.locals.user._id },
      { active: false },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!user) {
      return next(new AppError('User does not exist', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};
