import { Query, Document } from 'mongoose';
import { Tour } from '../model/tour.model';

class APIFeatures {
  constructor(
    public query: Query<any, Document<Tour>>,
    public queryString: any
  ) {}

  filter() {
    // 1a. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'field'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1b. Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g, (val) => `$${val}`);
    const parsedQuery = JSON.parse(queryStr);
    this.query = this.query.find(parsedQuery);

    return this;
  }

  sort() {
    // 2. Sorting
    if (this.queryString.sort) {
      let sortQuery = this.queryString.sort as string;
      sortQuery = sortQuery.split(',').join(' ');
      this.query = this.query.sort(sortQuery);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitField() {
    // 3.Limiting Fields
    if (this.queryString.field) {
      let fieldQuery = this.queryString.field as string;
      fieldQuery = fieldQuery.split(',').join(' ');
      this.query = this.query.select(fieldQuery);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = parseInt(String(this.queryString.page)) || 1;
    const limit = parseInt(String(this.queryString.limit)) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
