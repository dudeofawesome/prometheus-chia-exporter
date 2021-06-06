#!/usr/bin/env ruby

# @type [Array<String>]
staged_files = `git diff --cached --name-only --diff-filter=ACM`.split("\n")
staged_files_eslint = staged_files
  .select { |file| File.extname(file).match(/tsx?|jsx?/) }

if staged_files.length == 0
  exit 0
end

# Check for eslint
eslint_path = `which eslint`
if eslint_path == ''
  eslint_path = "#{Dir.pwd}/node_modules/.bin/eslint"
end

PASS=true

for file in staged_files_eslint
  "#{eslint_path} #{file}"

  if $?.exitstatus == 0
    puts "ESLint Passed: #{file}"
  else
    puts "ESLint Failed: #{file}"
    PASS=false
  end
end

if !PASS
  puts "COMMIT FAILED: Your commit contains files that should pass ESLint but do not. Please fix the ESLint errors and try again."
  exit 1
else
  puts "COMMIT SUCCEEDED"
  exit 0
end
