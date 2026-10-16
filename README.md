# portent releases

Public distribution files for [portent](https://adrianfernandezalv.github.io/portent-releases/), a macOS menu bar app for developers running AI coding agents.

Served with GitHub Pages:

- `models.json`: context window per model, read by the app at most once a day. Longest matching `prefix` wins; a `[1m]` model suffix means 1M tokens; when a session holds more tokens than listed, the next of `tiers` is assumed.
  Kept current by a daily workflow that reads Anthropic's [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) and opens a pull request when a context window changes.

Releases, the update feed and the install script will live here too.
