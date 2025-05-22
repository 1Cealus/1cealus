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

  // Define the full-range window
  const from = '1970-01-01T00:00:00Z';                // or your actual join date
  const to   = new Date().toISOString();

  const client = graphql.defaults({
    headers: { authorization: `token ${process.env.GITHUB_TOKEN}` }
  });

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
        }
      }
    }
  `;

  const { user } = await client(query, { login, from, to });
  const total = user.contributionsCollection.totalCommitContributions;

  const badge = {
    schemaVersion: 1,
    label: 'all-time commits',
    message: String(total),
    color: 'blue'
  };

  fs.writeFileSync(argv['out-file'], JSON.stringify(badge, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
