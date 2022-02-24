import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  post,
  pre,
  prop,
  Ref,
} from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { updateTour } from '../service/tour.service';
import { Tour } from './tour.model';
import { User } from './user.model';

@index({ tour: 1, user: 1 }, { unique: true })
@pre<ModelType<Review>>(/^find/, function () {
  this.populate({ path: 'user', select: 'firstName lastName email' });
})
@pre<ModelType<Review>>(/^findOneAnd/, async function () {
  this.r = await this.clone().findOne();
})
@post<Review>(/^findOneAnd/, function () {
  if (!this.r === null) return;
  this.r.constructor.calculateRating(this.r.tour);
})
@post<Review>('save', function (doc) {
  this.constructor.calculateRating(doc.tour);
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Review {
  @prop({ trim: true, minlength: 10 })
  review: string;

  @prop({ min: 1, max: 5, required: true })
  rating: number;

  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @prop({ ref: () => Tour, required: true })
  tour: Ref<Tour>;

  static async calculateRating(this: ModelType<Review>, tourId: string) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await updateTour(
        { _id: tourId },
        {
          ratingsAverage: stats[0].avgRating,
          ratingsQuantity: stats[0].nRating,
        },
        { runValidators: true, new: true, lean: true }
      );
    } else {
      await updateTour(
        { _id: tourId },
        {
          ratingsAverage: 4.5,
          ratingsQuantity: 0,
        },
        { runValidators: true, new: true, lean: true }
      );
    }
  }
}

const reviewModel = getModelForClass(Review);
export default reviewModel;
