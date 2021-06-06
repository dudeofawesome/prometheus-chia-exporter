#!/usr/bin/env node
/* eslint-disable */

/**
 * Emojify Github Desktop commit messages
 */

const ChildProcess = require('child_process');
const { Duration, Interval } = require('luxon');
const Exec = command => ChildProcess.execSync(command).toString();

const GIT = require('./git-status');

if (
  Interval.fromDateTimes(
    GIT.now.minus(Duration.fromObject({ seconds: 10 })),
    GIT.now,
  ).contains(GIT.commit.time)
) {
  let amend = false;

  // Skip CI build if merging from master
  if (
    GIT.branch === 'develop' &&
    GIT.commit.message.match(/^.*Merge branch 'master'.*/)
  ) {
    GIT.commit.message = `${GIT.commit.message}\n\n[ci skip]`;
    amend = true;
  }

  if (GIT.commit.message.match(/^.*hotfix.*/)) {
    GIT.commit.message = `🚑 ${GIT.commit.message}`;
    amend = true;
  }

  if (GIT.commit.message.match(/^.*Merge( remote-tracking)? branch.*/)) {
    GIT.commit.message = `🔀 ${GIT.commit.message}`;
    amend = true;
  }

  if (GIT.branch === 'master') {
    GIT.commit.message = `🚀 ${GIT.commit.message}`;
    amend = true;
  }

  if (amend) {
    Exec(`git commit --amend -m "${GIT.commit.message}"`);
  }
}
