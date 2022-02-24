import jwt, { SignOptions } from 'jsonwebtoken';
import config from 'config';

export const signJwt = (
  object: Object,
  keyName: 'refreshPrivateKey' | 'accessPrivateKey',
  options: SignOptions
) => {
  const privateKey = config.get<string>(keyName);
  return jwt.sign(object, privateKey, {
    ...(options && options),
    algorithm: 'RS256',
  });
};

export const verifyJwt = <T>(
  token: string,
  keyName: 'refreshPublicKey' | 'accessPublicKey'
): T | null => {
  try {
    const publicKey = config.get<string>(keyName);
    const decoded = jwt.verify(token, publicKey) as T;
    return decoded;
  } catch (err: any) {
    return null;
  }
};
