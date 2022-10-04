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
  lastRunAt: DateTime;
  paperRepository: PaperRepository;
}) {
  const { client, lastRunAt, paperRepository } = params;
  const papers = await paperRepository.matching({
    category: 'cs.*',
    limit: TWITTER_MAX_POSTS_IN_WINDOW,
  });

  papers.forEach(async (paper) => {
    // TODO: Depend on not the last run time but the last item that was tweeted.
    if (paper.isSubmittedBefore(lastRunAt)) {
      return;
    }

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
    lastRunAt: DateTime.local().minus(SCRIPT_EXECUTION_INTERVAL),
    paperRepository: new ArxivPaperRepository(ARXIV_API_ENDPOINT),
  });
})();
