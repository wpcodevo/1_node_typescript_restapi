import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
  Severity,
} from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import bcrypt from 'bcryptjs';
import config from 'config';
import crypto from 'crypto';

enum Role {
  user = 'user',
  admin = 'admin',
  guide = 'guide',
  leadGuide = 'lead-guide',
}

@index({ email: 1 })
@pre<ModelType<User>>(/^find/, function () {
  this.find({ active: { $ne: false } });
})
@pre<User>('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    config.get<number>('costFactor')
  );

  return;
})
@pre<User>('save', function () {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangedAt = new Date(Date.now());
  return;
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ required: true })
  firstName: string;

  @prop({ required: true })
  lastName: string;

  @prop({ required: true, unique: true, lowercase: true })
  email: string;

  @prop({ required: true, minLength: 8 })
  password: string;

  @prop({ default: 'default.jpeg' })
  photo?: string;

  @prop({ default: true, select: false })
  active: boolean;

  @prop({ enum: Role, default: 'user' })
  role: Role;

  @prop({ default: false, select: false })
  verified: boolean;

  @prop({ select: false })
  verificationCode: string | undefined;

  @prop({ select: false })
  passwordResetToken: string | undefined;

  @prop({ select: false, type: () => Date })
  passwordResetAt: Date | undefined;

  @prop({ type: () => Date })
  passwordChangedAt: Date;

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  async comparePasswords(this: DocumentType<User>, candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  createVerificationCode() {
    const verificationCode = crypto.randomBytes(32).toString('hex');

    this.verificationCode = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');

    return verificationCode;
  }

  createPasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.passwordResetAt = new Date(Date.now() + 10 * 60 * 1000);

    return resetToken;
  }

  passwordChangedAfter(this: DocumentType<User>, JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        String(this.passwordChangedAt.getTime() / 1000),
        10
      );

      return JWTTimestamp < changedTimestamp;
    }

    return false;
  }
}

const userModel = getModelForClass(User);
export default userModel;
