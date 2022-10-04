import { DateTime } from 'luxon';

// TODO: Make the type narrower
export type Category = `${string}.${string}`;

export class Paper {
  readonly category: Category;
  readonly submittedAt: DateTime;
  readonly summary: string;
  readonly title: string;
  readonly url: URL;

  constructor(params: {
    category: Category;
    submittedAt: DateTime;
    summary: string;
    title: string;
    url: URL;
  }) {
    this.category = params.category;
    this.submittedAt = params.submittedAt;
    this.summary = params.summary;
    this.title = params.title;
    this.url = params.url;
  }

  isSubmittedBefore(dateTime: DateTime): boolean {
    return this.submittedAt.diff(dateTime).as('hours') < 0;
  }

  toString(): string {
    return `[${this.category}] ${this.title} ${this.url}\n\n${this.summary}`;
  }
}
