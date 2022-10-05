import { Category, Paper } from '../domain/Paper';
import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import { Criteria, PaperRepository } from '../domain/PaperRepository';

const CHUNK_SIZE = 100;
// For details, see https://arxiv.org/help/api/user-manual
const DEFAULT_PARAMS = {
  max_results: CHUNK_SIZE,
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
    const papers: Paper[] = [];
    let page = 0;
    let resultSize = 0;

    paginationLoop: do {
      const feedUrl = this.buildUrlWithParams(this.baseUrl, {
        search_query: `cat:${criteria.category}`,
        start: page * CHUNK_SIZE,
      });
      const feed = await this.client.parseURL(feedUrl.toString());

      for (const item of feed.items) {
        const publishedAt = DateTime.fromISO(item.pubDate!);
        if (publishedAt.diff(criteria.publishedAfter).milliseconds < 0) {
          break paginationLoop;
        }

        papers.push(
          new Paper({
            category: item.category.$.term,
            publishedAt: DateTime.fromISO(item.pubDate!),
            summary: this.normalizeSummary(item.summary!),
            title: this.normalizeTitle(item.title!),
            url: new URL(item.link!),
          })
        );
      }

      page++;
      resultSize = feed.items.length;
    } while (resultSize > 0);

    return papers;
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
