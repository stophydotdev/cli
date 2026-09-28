---
"@stophy/cli": major
---

The CLI now covers every Stophy source.

- Every Stophy source is now in the CLI, for example `stophy reddit search`, `stophy maps search` and `stophy amazon product`. Run `stophy --help` to see them all.
- Results print as markdown. Add `--json` for JSON.
- The main input needs no flag: `stophy youtube search "bun runtime"`.
- `stophy login --browser` shows a code to match on stophy.dev. Each computer gets one key, and `stophy logout` revokes it.
- The `credits` command is gone. Your balance is in `stophy status` and `stophy usage`.
- Without a key and without a terminal, the CLI exits with an error instead of waiting for input.
