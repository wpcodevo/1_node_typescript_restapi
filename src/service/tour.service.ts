import tourModel, { Tour } from '../model/tour.model';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export const createTour = async (input: Partial<Tour>) => {
  return await tourModel.create(input);
};

export const getTour = async (
  query: FilterQuery<Tour>,
  options: QueryOptions = { lean: true }
) => {
  return await tourModel
    .findOne(query, {}, options)
    .populate({ path: 'reviews' });
};

export const updateTour = async (
  query: FilterQuery<Tour>,
  update: UpdateQuery<Tour>,
  options: QueryOptions
) => {
  return await tourModel.findOneAndUpdate(query, update, options);
};

export const deleteTour = async (query: FilterQuery<Tour>) => {
  return await tourModel.findOneAndDelete(query);
};
