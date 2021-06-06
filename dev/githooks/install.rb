#!/usr/bin/env ruby
# Makes symlinks in $ROOT/.git/hooks from $ROOT/dev/githooks

git_hooks_folder = "#{Dir.pwd}/.git/hooks"
# List of all possible git hooks
git_hooks = %w[
  applypatch-msg
  pre-applypatch
  post-applypatch
  pre-commit
  prepare-commit-msg
  commit-msg
  post-commit
  pre-rebase
  post-checkout
  post-merge
  pre-receive
  update
  post-receive
  post-update
  pre-auto-gc
  post-rewrite
  pre-push
]

# make .git/hooks folder if it doesn't exist
Dir.mkdir(git_hooks_folder) if !Dir.exist?(git_hooks_folder)

# symlink common-hook in to .git/hooks/{hooks}
Dir.entries(File.dirname(File.expand_path(__FILE__)))
  .map { |file| file.gsub(/\.\w+$/, '') }
  .select { |hook| git_hooks.include?(hook) }
  .each do |hook|
    if !File.exist?("#{git_hooks_folder}/#{hook}")
      File.symlink(
        "#{File.dirname(File.expand_path(__FILE__))}/common-hook",
        "#{git_hooks_folder}/#{hook}"
      )
    end
  end
