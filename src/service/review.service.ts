import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import reviewModel, { Review } from '../model/review.model';

export const createReview = async (input: Partial<Review>) => {
  return await reviewModel.create(input);
};

export const updateReview = async (
  query: FilterQuery<Review>,
  update: UpdateQuery<Review>,
  options: QueryOptions
) => {
  return await reviewModel.findOneAndUpdate(query, update, options);
};

export const getReview = async (
  query: FilterQuery<Review>,
  options: QueryOptions = { lean: true }
) => {
  return await reviewModel.findOne(query, {}, options);
};

export const deleteReview = async (query: FilterQuery<Review>) => {
  return await reviewModel.findOneAndDelete(query);
};
