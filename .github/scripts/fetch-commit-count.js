// .github/scripts/fetch-commit-count.js
import fs from 'fs';
import { request } from '@octokit/graphql';
import minimist from 'minimist';

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['user', 'out-file'],
    default: { 'out-file': 'commit-count.json' }
  });

  const graphql = request.defaults({
    headers: { authorization: `token ${process.env.GITHUB_TOKEN}` }
  });

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
        }
      }
    }
  `;

  const { user } = await graphql(query, { login: argv.user });
  const total = user.contributionsCollection.totalCommitContributions;

  // Build a Shields.io dynamic-JSON badge payload:
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
