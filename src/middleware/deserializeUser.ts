import { NextFunction, Request, Response } from 'express';
import { get, omit } from 'lodash';
import { excludedFields } from '../controller/auth.controller';
import { User } from '../model/user.model';
import { findSession, reIssueNewAccessToken } from '../service/session.service';
import { findUser } from '../service/user.service';
import AppError from '../utils/appError';
import { verifyJwt } from '../utils/jwt';

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the access token
    let accessToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (!accessToken) {
      return next(new AppError('You are not logged in', 401));
    }

    const refreshToken = get(req, 'headers.x-refresh');

    // Validate the access token
    const decoded = verifyJwt<{ user: string; session: string; iat: number }>(
      accessToken,
      'accessPublicKey'
    );

    // Check if the session is valid
    if (decoded) {
      const session = await findSession({ sessionId: decoded.session });

      if (!session || !session.valid) {
        return next();
      }

      const user = await findUser({ _id: session.user });

      if (user?.passwordChangedAfter(decoded.iat)) {
        return next(
          new AppError(
            'User recently changed password, please login again',
            403
          )
        );
      }

      res.locals.user = {
        ...omit(user?.toJSON(), excludedFields),
        session: session._id,
      };
      return next();
    }

    if (!decoded && refreshToken) {
      const newAccessToken = await reIssueNewAccessToken(refreshToken);
      if (newAccessToken) {
        const result = verifyJwt<{ user: string; session: string }>(
          newAccessToken,
          'accessPublicKey'
        );
        res.setHeader('x-access-token', newAccessToken);
        const verifiedUser = await findUser({ _id: result?.user });
        res.locals.user = {
          ...omit(verifiedUser?.toJSON(), excludedFields),
          session: result?.session,
        };
        return next();
      }
    }

    return next();
  } catch (err: any) {
    next(err);
  }
};
