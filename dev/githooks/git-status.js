/* eslint-disable */
/**
 * Gets common git status info
 */

const ChildProcess = require('child_process');
const { DateTime } = require('luxon');
const Exec = command => ChildProcess.execSync(command).toString();

const branch = Exec(`git rev-parse --abbrev-ref HEAD`);
const commit = {
  hash: Exec(`git log --pretty=format:"%H" -1`),
  full: Exec(`git log -1`),
  message: Exec(`git log --pretty=format:"%B" -1`),
  time: DateTime.fromSeconds(
    Number.parseInt(Exec(`git show -s --format=%ct -1`)),
  ),
};
const now = DateTime.local();

module.exports = {
  branch,
  commit,
  now,
};
