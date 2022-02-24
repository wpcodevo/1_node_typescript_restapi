import { DocumentType } from '@typegoose/typegoose';
import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import config from 'config';
import sessionModel, { Session } from '../model/session.model';
import { User } from '../model/user.model';
import { signJwt, verifyJwt } from '../utils/jwt';
import { findUser } from './user.service';

export const createSession = async ({
  userId,
  userAgent,
}: {
  userId: string;
  userAgent: string;
}) => {
  return await sessionModel.create({ user: userId, userAgent });
};

export const findSession = async ({ sessionId }: { sessionId: string }) => {
  return await sessionModel.findOne({ _id: sessionId }).select('+valid');
};

export const findSessions = async (query: FilterQuery<Session>) => {
  return await sessionModel.find(query);
};

export const deleteSession = async (
  query: FilterQuery<Session>,
  update: UpdateQuery<Session>,
  options: QueryOptions
) => {
  return await sessionModel
    .findOneAndUpdate(query, update, options)
    .select('+valid');
};

export const signTokens = async (
  user: DocumentType<User>,
  userAgent: string
) => {
  const session = await createSession({ userId: user._id, userAgent });

  const accessToken = signJwt(
    { user: user._id, session: session._id },
    'accessPrivateKey',
    {
      expiresIn: config.get<string>('accessTokenExpiresIn'),
    }
  );

  const refreshToken = signJwt({ session: session._id }, 'refreshPrivateKey', {
    expiresIn: '1y',
  });

  return { accessToken, refreshToken };
};

export const reIssueNewAccessToken = async (refreshToken: string) => {
  const decoded = verifyJwt<{ session: string }>(
    refreshToken,
    'refreshPublicKey'
  );
  if (!decoded) return false;

  const session = await findSession({ sessionId: decoded.session });
  if (!session || !session.valid) return false;

  const user = await findUser({ _id: session.user });
  if (!user) return false;

  return signJwt({ user: user._id, session: session._id }, 'accessPrivateKey', {
    expiresIn: config.get<string>('accessTokenExpiresIn'),
  });
};
