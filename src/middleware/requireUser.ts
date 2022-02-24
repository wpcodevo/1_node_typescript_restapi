import { NextFunction, Request, Response } from 'express';

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;
  if (!user) {
    return res.status(403).json({
      status: 'fail',
      message: 'Invalid token or session has expired',
    });
  }

  next();
};

export default requireUser;
