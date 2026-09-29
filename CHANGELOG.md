# @stophy/cli

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
