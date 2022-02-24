import userModel, { User } from '../model/user.model';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export const createUser = async (input: Partial<User>) => {
  return await userModel.create(input);
};

export const findUser = async (query: FilterQuery<User>) => {
  return await userModel.findOne(query).select('+verified');
};

export const findUserByEmail = async ({ email }: { email: string }) => {
  return await userModel.findOne({ email }).select('+verified');
};

export const findAndUpdateUser = async (
  query: FilterQuery<User>,
  update: UpdateQuery<User>,
  options: QueryOptions
) => {
  return await userModel.findOneAndUpdate(query, update, options);
};
