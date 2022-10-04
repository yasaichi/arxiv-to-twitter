import { Category, Paper } from './Paper';

export type Criteria = {
  category: Category;
  limit: number;
};

export interface PaperRepository {
  matching(criteria: Criteria): Promise<Paper[]>;
}
