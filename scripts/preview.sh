#!/bin/sh
# Prefer the isolated Ruby installed for this project when available.
set -eu
cd "$(dirname "$0")/.."
harry_ruby="$HOME/.local/share/harry-site-runtime/portable-ruby/3.4.5/bin"
if [ -x "$harry_ruby/ruby" ]; then
  PATH="$harry_ruby:$PATH"
  export PATH
fi
if ! ruby -e 'abort unless Gem::Version.new(RUBY_VERSION) >= Gem::Version.new("3.4")'; then
  printf '%s\n' 'Please install Ruby 3.4 and Bundler; see README.md.' >&2
  exit 1
fi
bundle check >/dev/null 2>&1 || bundle install
exec bundle exec jekyll serve --host 127.0.0.1 --port 4000 --force_polling
