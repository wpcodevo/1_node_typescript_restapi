import { object, string, TypeOf } from 'zod';

export const createUserSchema = object({
  body: object({
    firstName: string({
      required_error: 'First name is required',
    }),
    lastName: string({
      required_error: 'Last name is required',
    }),
    email: string({
      required_error: 'Email is required',
    }).email('Email is invalid'),
    photo: string().optional(),
    password: string({
      required_error: 'Password is required',
    }).min(8, 'Password must be more than 8 characters'),
    passwordConfirm: string({
      required_error: 'Please confirm your password',
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  }),
});

export const verifyUserSchema = object({
  params: object({
    verificationCode: string(),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).email('Email is invalid'),
  }),
});

export const resetPasswordSchema = object({
  params: object({
    resetToken: string(),
  }),
  body: object({
    password: string({
      required_error: 'Password is required',
    }).min(8, 'Password must be more than 8 characters'),
    passwordConfirm: string({
      required_error: 'Please confirm your password',
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  }),
});

export const updatePasswordSchema = object({
  body: object({
    passwordCurrent: string({
      required_error: 'Current password is required',
    }).min(8, 'Incorrect current password'),
    password: string({
      required_error: 'Password is required',
    }).min(8, 'Password must be more than 8 characters'),
    passwordConfirm: string({
      required_error: 'Please confirm your password',
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  }),
});

export const updateMeSchema = object({
  body: object({
    firstName: string({}),
    lastName: string({}),
    email: string({}).email('Email is invalid'),
    photo: string(),
    password: string(),
    passwordConfirm: string(),
  }).partial(),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>['body'];
export type VerifyUserInput = TypeOf<typeof verifyUserSchema>['params'];
export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>;
export type UpdatePasswordInput = TypeOf<typeof updatePasswordSchema>['body'];
export type UpdateMeInput = TypeOf<typeof updateMeSchema>['body'];
