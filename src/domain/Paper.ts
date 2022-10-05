import { DateTime } from 'luxon';

// TODO: Make the type narrower
export type Category = `${string}.${string}`;

export class Paper {
  readonly category: Category;
  readonly publishedAt: DateTime;
  readonly summary: string;
  readonly title: string;
  readonly url: URL;

  constructor(params: {
    category: Category;
    publishedAt: DateTime;
    summary: string;
    title: string;
    url: URL;
  }) {
    this.category = params.category;
    this.publishedAt = params.publishedAt;
    this.summary = params.summary;
    this.title = params.title;
    this.url = params.url;
  }

  toString(): string {
    return `[${this.category}] ${this.title} ${this.url}\n\n${this.summary}`;
  }
}
