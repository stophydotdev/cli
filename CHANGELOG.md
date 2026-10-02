# @stophy/cli

## 2.0.5

### Patch Changes

- 8d96f89: `stophy google search` replaces `stophy web search` as the command that works without logging in. New commands: `google news`, `google images`, `google shopping`, `google aiMode`, `ai answer`, `linkedin people search` and `linkedin companies search`.

## 2.0.4

### Patch Changes

- c3f071a: Add commands for App Store, Google Play, Indeed, Tripadvisor and Walmart. `stophy describe transcript` and `stophy endpoints` now show that a transcript costs 2 credits when the video has captions, and otherwise 2 plus 1 per 10 seconds of audio, up to 30 minutes.

## 2.0.3

### Patch Changes

- af4fa9d: Follow the API we ship. Help examples and the README no longer use removed commands, and only `stophy web search` is listed as working without a login. `tiktok profile` and `instagram profile` print their list as results and page with `--limit` and `--cursor`. `--cursor` takes the cursor exactly as the API returned it, so paging with a small `--limit` works.

## 2.0.2

### Patch Changes

- 04ee635: The CLI follows the new flat Stophy API. Lists print one row per result with its title and link, other results print as `name: value` lines, and `--json` prints the raw data. Single-word commands such as `stophy transcript <link>` and `stophy suggest`, and choices such as `--network`, `--source` and `--by`, work from the catalog. Markdown output and the removed options are gone.

## 2.0.1

### Patch Changes

- 1f7a9bd: `stophy init` now sets up everything in one command: it logs you in, installs the Stophy skills, and adds the MCP server. Errors now end with the request id, and every command's `--help` lists `--raw`. The package description and keywords are updated.

## 2.0.0

### Major Changes

- 6639262: The CLI now covers every Stophy source.

  - Every Stophy source is now in the CLI, for example `stophy reddit search`, `stophy maps search` and `stophy amazon product`. Run `stophy --help` to see them all.
  - Results print as markdown. Add `--json` for JSON.
  - The main input needs no flag: `stophy youtube search "bun runtime"`.
  - `stophy login --browser` shows a code to match on stophy.dev. Each computer gets one key, and `stophy logout` revokes it.
  - The `credits` command is gone. Your balance is in `stophy status` and `stophy usage`.
  - Without a key and without a terminal, the CLI exits with an error instead of waiting for input.

## 1.1.0

### Minor Changes

- a0011a9: Add `stophy init --all --browser` for one-command CLI installation, global agent skill setup, and browser authentication.

### Patch Changes

- 35b9339: Ensure the curl installer updates the currently resolved Stophy executable when possible, with a PATH-safe fallback for installations that are not writable.

## 1.0.9

### Patch Changes

- 7daf26b: Publish the CLI through the new Changesets and trusted publishing workflow, keeping the documented installer routes aligned with the hosted `stophy.dev` install commands.
