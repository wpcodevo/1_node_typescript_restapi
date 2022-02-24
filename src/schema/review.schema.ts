import { number, object, string, TypeOf } from 'zod';

export const createReviewSchema = object({
  body: object({
    review: string({
      required_error: 'Review is required',
    }).min(10, 'Review must be more than 10 characters'),
    rating: number({
      required_error: 'Rating is required',
    })
      .min(1, 'Rating must be more than 1')
      .max(5, 'Rating must be less than 5')
      .positive(),
  }),
});

const params = {
  params: object({
    reviewId: string(),
  }),
};

export const updateReviewSchema = object({
  ...params,
  body: object({
    review: string().min(10, 'Review must be more than 10 characters'),
    rating: number()
      .min(1, 'Rating must be more than 1')
      .max(5, 'Rating must be less than 5')
      .positive(),
  }).partial(),
});

export const deleteReviewSchema = object({
  ...params,
});

export const getReviewSchema = object({
  ...params,
});

export type CreateReviewInput = TypeOf<typeof createReviewSchema>['body'];
export type UpdateReviewInput = TypeOf<typeof updateReviewSchema>;
export type DeleteReviewInput = TypeOf<typeof deleteReviewSchema>['params'];
export type GetReviewInput = TypeOf<typeof getReviewSchema>['params'];
