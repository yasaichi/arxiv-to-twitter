import truncate from 'truncate';
import { DateTime, Duration } from 'luxon';
import Twitter from 'twitter';
import { ArxivPaperRepository } from './infrastructure/ArxivPaperRepository';
import { PaperRepository } from './domain/PaperRepository';

const ARXIV_API_ENDPOINT = new URL('https://export.arxiv.org/api/query');
const SCRIPT_EXECUTION_INTERVAL = Duration.fromObject({ hour: 1 });
const TWITTER_POST_ENDPOINT = 'statuses/update';
const TWITTER_MAX_CONTENT_LENGTH = 280;
const TWITTER_MAX_POSTS_IN_WINDOW = 200; // https://developer.twitter.com/en/docs/twitter-api/rate-limits

async function main(params: {
  client: Twitter;
  lastCheckedPaperPublishedAt: DateTime;
  paperRepository: PaperRepository;
}) {
  const { client, paperRepository } = params;
  const papers = await paperRepository.matching({
    category: 'cs.*',
    publishedAfter: params.lastCheckedPaperPublishedAt,
  });

  papers.slice(0, TWITTER_MAX_POSTS_IN_WINDOW).forEach(async (paper) => {
    try {
      await client.post(TWITTER_POST_ENDPOINT, {
        status: truncate(paper.toString(), TWITTER_MAX_CONTENT_LENGTH - 10),
      });
      console.log(`Successfully posted ${paper.url}`);
    } catch (err) {
      console.error(err);
    }
  });
}

(async () => {
  await main({
    client: new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY!,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET!,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY!,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    }),
    paperRepository: new ArxivPaperRepository(ARXIV_API_ENDPOINT),
    // TODO: Depend on not the last run time but one of the latest paper that was tweeted.
    lastCheckedPaperPublishedAt: DateTime.local().minus(
      SCRIPT_EXECUTION_INTERVAL
    ),
  });
})();
