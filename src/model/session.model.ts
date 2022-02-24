import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  Ref,
  Severity,
} from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { User } from './user.model';

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@pre<ModelType<Session>>(/^find/, function () {
  this.find({ valid: { $ne: false } });
})
@pre<Session>('save', function () {
  if (!this.isModified('valid') || this.isNew) return;

  this.sessionDeletedAt = new Date(Date.now());
  return;
})
export class Session {
  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @prop({ select: false, default: true })
  valid: boolean;

  @prop()
  userAgent?: string;

  @prop({ select: false, type: () => Date })
  sessionDeletedAt: Date;

  sessionChangedAfter(this: DocumentType<Session>, JWTTimestamp: number) {
    if (this.sessionDeletedAt) {
      const changedTimestamp = parseInt(
        String(this.sessionDeletedAt.getTime() / 1000)
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }
}

const sessionModel = getModelForClass(Session);

export default sessionModel;
