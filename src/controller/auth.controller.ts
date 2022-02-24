import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';
import { CreateSessionInput } from '../schema/session.schema';
import {
  CreateUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdatePasswordInput,
  VerifyUserInput,
} from '../schema/user.schema';
import {
  deleteSession,
  findSession,
  findSessions,
  signTokens,
} from '../service/session.service';
import { createUser, findUser, findUserByEmail } from '../service/user.service';
import AppError from '../utils/appError';
import Email from '../utils/email';

export const excludedFields = [
  'password',
  'verificationCode',
  'verified',
  'passwordChangedAt',
  'passwordResetToken',
  'passwordResetAt',
  'active',
];

export const createUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await createUser({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    });

    const verificationCode = user.createVerificationCode();
    await user.save();

    try {
      const url = `${req.protocol}://${req.get('host')}/${verificationCode}`;
      await new Email(user, url).sendVerificationCode();
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending email',
      });
    }

    const newUser = omit(user.toJSON(), excludedFields);
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(200).json({
        status: 'fail',
        message: 'Email already exist',
      });
    }
    next(err);
  }
};

export const verifyUserHandler = async (
  req: Request<VerifyUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the user based on the POSTed verificationCode
    const verificationCode = crypto
      .createHash('sha256')
      .update(req.params.verificationCode)
      .digest('hex');

    const user = await findUser({ verificationCode });
    if (!user) {
      return res.status(403).json({
        status: 'fail',
        message: 'Could not verify user',
      });
    }

    user.verified = true;
    user.verificationCode = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User successfully verified',
    });
  } catch (err: any) {
    next(err);
  }
};

export const forgotPasswordHandler = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the user from the collection
    const user = await findUser({ email: req.body.email });
    const message =
      'You will receive a reset email if user with that email exist';
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message,
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Account not verified',
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    try {
      const url = `${req.protocol}://${req.get('host')}/${resetToken}`;
      await new Email(user, url).sendPasswordResetToken();

      res.status(200).json({
        status: 'success',
        message,
      });
    } catch (err: any) {
      user.passwordResetToken = undefined;
      user.passwordResetAt = undefined;
      await user.save();
      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending email',
      });
    }
  } catch (err: any) {
    next(err);
  }
};

export const resetPasswordHandler = async (
  req: Request<ResetPasswordInput['params'], {}, ResetPasswordInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the user from the collection
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await findUser({
      passwordResetToken,
      passwordResetAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid token or token has expired',
      });
    }

    // Change password data
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetAt = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User password updated successfully',
    });
  } catch (err: any) {
    next(err);
  }
};

export const createSessionHandler = async (
  req: Request<{}, {}, CreateSessionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the user exist and password is correct
    const { email, password } = req.body;
    const user = await findUserByEmail({ email });

    if (!user || !(await user.comparePasswords(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }
    if (!user.verified) {
      return res.status(401).json({
        status: 'fail',
        message: 'Account not verified',
      });
    }

    // Create refresh and access token
    const { refreshToken, accessToken } = await signTokens(
      user,
      String(req.get('user-agent') || '')
    );

    // Send both refresh and access token
    res.status(201).json({
      status: 'success',
      refreshToken,
      accessToken,
    });
  } catch (err: any) {
    next(err);
  }
};

export const findAllSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    const sessions = await findSessions({ user: user._id });

    res.status(200).json({
      status: 'success',
      results: sessions.length,
      data: {
        sessions,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    const session = await findSession({ sessionId: user.session });

    if (!session) {
      return next(new AppError('No document found with that ID', 404));
    }

    session.valid = false;
    session.sessionChangedAfter(user.iat);
    await session.save();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};

export const updatePasswordHandler = async (
  req: Request<{}, {}, UpdatePasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user from the collection and check if the current password is valid
    const { passwordCurrent, password } = req.body;
    const user = await findUser({ _id: res.locals.user._id });

    if (!user || !(await user.comparePasswords(passwordCurrent))) {
      return next(
        new AppError(
          `Your current password is incorrect or user doesn't exist`,
          401
        )
      );
    }

    user.password = password;
    await user.save();

    const { accessToken, refreshToken } = await signTokens(
      user,
      req.get('user-agent') || ''
    );

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    next(err);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.user.role)) {
      return next(
        new AppError('You are not allowed to perform this action', 403)
      );
    }
    next();
  };
};
