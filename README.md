# portent releases

Downloads and public files for **portent**, a macOS menu bar app for developers running AI coding agents: dev servers and who started them, live Claude sessions, and Claude plan usage per account.

## Install

```bash
curl -fsSL https://adrianfernandezalv.github.io/portent-releases/install.sh | bash
```

or with Homebrew:

```bash
brew install adrianfernandezalv/tap/portent
```

or download the DMG from [Releases](https://github.com/adrianfernandezalv/portent-releases/releases) and drag portent to Applications.

Requires macOS 14 or later. portent updates itself (Sparkle); you can also check from Settings → About.

### First launch warning

portent is signed with its own certificate, not notarized by Apple. The install script and the Homebrew cask clear the quarantine flag, so it opens normally. If you installed from the DMG and macOS says it can't verify the developer, open **System Settings → Privacy & Security** and click **Open Anyway** once.

## Files

Served with GitHub Pages:

- `index.html` and `assets/`: the landing page. Clips and stills come from the app's `--demo` scenes (made-up data), recorded with `scripts/landing/record-all.sh` in the app repo.
- `appcast.xml`: Sparkle update feed, EdDSA-signed updates.
- `install.sh`: the install script above.
- `models.json`: context window per model, read by the app at most once a day. Longest matching `prefix` wins; a `[1m]` model suffix means 1M tokens; when a session holds more tokens than listed, the next of `tiers` is assumed.
  Kept current by a daily workflow that reads Anthropic's [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) and opens a pull request when a context window changes.
