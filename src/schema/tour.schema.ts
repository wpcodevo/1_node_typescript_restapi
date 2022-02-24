import {
  array,
  date,
  nativeEnum,
  number,
  object,
  preprocess,
  string,
  TypeOf,
} from 'zod';

enum Difficulty {
  easy = 'easy',
  medium = 'medium',
  difficult = 'difficult',
}

const params = {
  params: object({
    tourId: string(),
  }),
};

export const createTourSchema = object({
  body: object({
    name: string({
      required_error: 'Tour name is required',
    }).min(10, 'Tour name must be more than 10 characters'),
    duration: number({
      required_error: 'Duration is required',
    }).positive(),
    maxGroupSize: number({
      required_error: 'Max group size is required',
    }).positive(),
    difficulty: nativeEnum(Difficulty),
    ratingsAverage: number()
      .min(1, 'Rating must be more than 1')
      .max(5, 'Rating must be less than 5')
      .positive()
      .optional(),
    ratingsQuantity: number().positive().optional(),
    price: number({
      required_error: 'Price is required',
    }).positive(),
    summary: string({
      required_error: 'Summary is required',
    }).max(85, 'Summary must be less than 85 characters'),
    description: string().optional(),
    imageCover: string({
      required_error: 'Image cover is required',
    }),
    images: array(string()).optional(),
    startDates: array(
      preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
          return new Date(arg);
        }
      }, date())
    ).optional(),
  }),
});

export const getAllToursSchema = object({
  query: object({
    page: string(),
    limit: string(),
    field: string(),
    sort: string(),
  }).partial(),
});

export const getTourSchema = object({
  ...params,
});

export const updateTourSchema = object({
  ...params,
  body: object({
    name: string().min(10, 'Tour name must be more than 10 characters'),
    duration: number().positive(),
    maxGroupSize: number().positive(),
    difficulty: nativeEnum(Difficulty),
    ratingsAverage: number()
      .min(1, 'Rating must be more than 1')
      .max(5, 'Rating must be less than 5')
      .positive(),
    ratingsQuantity: number().positive(),
    price: number().positive(),
    summary: string().max(85, 'Summary must be less than 85 characters'),
    description: string(),
    imageCover: string(),
    images: array(string()),
    startDates: array(
      preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
          return new Date(arg);
        }
      }, date())
    ),
  }).partial(),
});

export const deleteTourSchema = object({
  ...params,
});

export type GetAllToursInput = TypeOf<typeof getAllToursSchema>['query'];
export type CreateTourInput = TypeOf<typeof createTourSchema>['body'];
export type GetTourInput = TypeOf<typeof getTourSchema>['params'];
export type UpdateTourInput = TypeOf<typeof updateTourSchema>;
export type DeleteTourInput = TypeOf<typeof deleteTourSchema>['params'];
