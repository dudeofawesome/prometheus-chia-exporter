#!/usr/bin/env node
/* eslint-disable */

/**
 * Emojify Github Desktop commit messages
 */

const ChildProcess = require('child_process');
const Exec = command => ChildProcess.execSync(command).toString();

const GIT = require('./git-status');

let amend = false;

if (GIT.commit.message.match(/^Revert.*/)) {
  GIT.commit.message = `⏪ ${GIT.commit.message}`;
  amend = true;
}

if (amend) {
  Exec(`git commit --amend -m "${GIT.commit.message}"`);
}
