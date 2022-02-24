import {
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
  Severity,
} from '@typegoose/typegoose';
import slugify from 'slugify';

enum Difficulty {
  easy = 'easy',
  medium = 'medium',
  difficult = 'difficult',
}
@index({ price: 1, ratingsAverage: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Location {
  @prop({ default: 'Point', enum: ['Point'] })
  type: string;

  @prop({ default: ['Point'] })
  coordinate: [Number];

  @prop()
  description: string;

  @prop()
  address: string;

  @prop()
  day?: number;
}
@pre<Tour>('save', function () {
  this.slug = slugify(this.name, { lower: true });
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Tour {
  @prop({ required: true, unique: true, minLength: 10 })
  name: string;

  @prop({ lowercase: true })
  slug: string;

  @prop({ required: true })
  duration: number;

  @prop({ required: true })
  maxGroupSize: number;

  @prop({ enum: Difficulty, required: true, lowercase: true })
  difficulty: Difficulty;

  @prop({
    min: 1,
    max: 5,
    default: 4.5,
    set: (val) => Math.round(val * 10) / 10,
  })
  ratingsAverage?: number;

  @prop({ default: 0 })
  ratingsQuantity?: number;

  @prop({ required: true })
  price: number;

  @prop({ required: true, maxLength: 85, trim: true })
  summary: string;

  @prop({ trim: true })
  description?: string;

  @prop({ required: true })
  imageCover: string;

  @prop()
  images?: string[];

  @prop({ type: () => [Date] })
  startDates?: Date[];

  @prop({})
  startLocation: Location;

  @prop()
  locations: [Location];

  @prop({
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
  })
  get reviews() {
    return undefined;
  }

  get durationWeek() {
    return this.duration / 7;
  }
}

const tourModel = getModelForClass(Tour);

export default tourModel;
