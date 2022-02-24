import express from 'express';
import {
  createUserHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  updatePasswordHandler,
  verifyUserHandler,
} from '../controller/auth.controller';
import {
  deleteMeHandler,
  getMeHandler,
  resizeUserPhoto,
  updateMeHandler,
  uploadUserPhoto,
} from '../controller/user.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import requireUser from '../middleware/requireUser';
import validate from '../middleware/validateResource';
import {
  createUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  updatePasswordSchema,
  verifyUserSchema,
} from '../schema/user.schema';

const router = express.Router();

router.post('/signup', validate(createUserSchema), createUserHandler);

router.get(
  '/verify/:verificationCode',
  validate(verifyUserSchema),
  verifyUserHandler
);

router.post(
  '/forgotPassword',
  validate(forgotPasswordSchema),
  forgotPasswordHandler
);

router.patch(
  '/resetPassword/:resetToken',
  validate(resetPasswordSchema),
  resetPasswordHandler
);

router.patch(
  '/updatePassword',
  deserializeUser,
  requireUser,
  validate(updatePasswordSchema),
  updatePasswordHandler
);

router.patch(
  '/updateMe',
  deserializeUser,
  requireUser,
  validate(updateMeSchema),
  uploadUserPhoto,
  resizeUserPhoto,
  updateMeHandler
);

router.get('/me', deserializeUser, requireUser, getMeHandler);
router.delete('/deleteMe', deserializeUser, requireUser, deleteMeHandler);

export default router;
