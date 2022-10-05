import { Category, Paper } from './Paper';
import { DateTime } from 'luxon';

export type Criteria = {
  category: Category;
  publishedAfter: DateTime;
};

export interface PaperRepository {
  matching(criteria: Criteria): Promise<Paper[]>;
}
