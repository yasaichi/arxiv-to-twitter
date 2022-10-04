import { Category, Paper } from '../domain/Paper';
import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import { Criteria, PaperRepository } from '../domain/PaperRepository';

// For details, see https://arxiv.org/help/api/user-manual
const DEFAULT_PARAMS = {
  sortBy: 'submittedDate',
  sortOrder: 'descending',
};

type CustomItemFields = {
  category: {
    $: {
      term: Category;
    };
  };
};

export class ArxivPaperRepository implements PaperRepository {
  private baseUrl: URL;
  private client: Parser<{}, CustomItemFields>;

  constructor(apiEndpoint: URL) {
    this.baseUrl = this.buildUrlWithParams(apiEndpoint, DEFAULT_PARAMS);
    this.client = new Parser({
      customFields: { item: ['category'] },
    });
  }

  async matching(criteria: Criteria): Promise<Paper[]> {
    const feedUrl = this.buildUrlWithParams(this.baseUrl, {
      max_results: criteria.limit,
      search_query: `cat:${criteria.category}`,
    });
    const feed = await this.client.parseURL(feedUrl.toString());

    return feed.items.map(
      (item) =>
        new Paper({
          category: item.category.$.term,
          submittedAt: DateTime.fromISO(item.pubDate!),
          summary: this.normalizeSummary(item.summary!),
          title: this.normalizeTitle(item.title!),
          url: new URL(item.link!),
        })
    );
  }

  private buildUrlWithParams(base: URL, params: { [key: string]: any }): URL {
    const newUrl = new URL(base.toString());

    Object.entries(params).forEach(([name, value]) =>
      newUrl.searchParams.append(name, value.toString())
    );

    return newUrl;
  }

  private normalizeSummary(rawSummary: string): string {
    return rawSummary.trimStart().replaceAll('\n', ' ');
  }

  private normalizeTitle(rawTitle: string): string {
    return rawTitle.replaceAll('\n ', '');
  }
}
