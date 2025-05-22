// .github/scripts/fetch-commit-count.js
import fs from 'fs';
import { graphql } from '@octokit/graphql';
import minimist from 'minimist';

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['out-file'],
    default: { 'out-file': 'commit-count.json' }
  });
  const login = process.env.GITHUB_REPOSITORY_OWNER;
  if (!login) {
    console.error('No GitHub user/login provided');
    process.exit(1);
  }

  const client = graphql.defaults({
    headers: { authorization: `token ${process.env.GITHUB_TOKEN}` }
  });

  // 1) Fetch the user's account creation date
  const userData = await client(
    `
    query($login: String!) {
      user(login: $login) { createdAt }
    }
    `,
    { login }
  );
  const createdAt = new Date(userData.user.createdAt);
  const now = new Date();

  // 2) Break the timeframe into 1-year intervals
  let from = new Date(createdAt);
  let totalCommits = 0;

  const yearlyQuery = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
        }
      }
    }
  `;

  while (from < now) {
    const to = new Date(from);
    to.setFullYear(to.getFullYear() + 1);
    if (to > now) to.setTime(now.getTime());

    // fetch this year chunk
    const resp = await client(yearlyQuery, {
      login,
      from: from.toISOString(),
      to: to.toISOString()
    });
    totalCommits += resp.user.contributionsCollection.totalCommitContributions;

    // advance the window
    from = to;
  }

  // 3) Write badge JSON
  const badge = {
    schemaVersion: 1,
    label: 'all-time commits',
    message: String(totalCommits),
    color: 'blue'
  };
  fs.writeFileSync(argv['out-file'], JSON.stringify(badge, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
