# @stophy/cli

Web data for AI agents. The CLI reads the live Stophy catalog and calls `POST /v1/<source>/<endpoint>` from the terminal. Output is markdown by default.

## Quick start

Install the CLI globally, add every Stophy skill to all supported AI agents, and authenticate in your browser:

```bash
npx -y @stophy/cli@latest init --all --browser
```

## Install

```bash
npm install -g @stophy/cli
```

Or install a standalone binary (no Node.js required):

```bash
# macOS / Linux
curl -fsSL https://stophy.dev/install.sh | bash

# Windows (PowerShell)
irm https://stophy.dev/install.ps1 | iex

# Homebrew
brew install stophydotdev/tap/stophy
```

The npm package requires Node.js 20 or later. Get an API key at [stophy.dev](https://stophy.dev/dashboard).

## Auth

```bash
stophy login --browser           # opens browser
stophy login --api-key st_xxx    # paste key directly
export STOPHY_API_KEY="st_..."   # env var also works
```

`STOPHY_BASE_URL` overrides the API origin (default `https://api.stophy.dev`).

## Calls

Endpoint ids map to words. `youtube.search` is `stophy youtube search`. `youtube.comments.replies` is `stophy youtube comments replies`.

```bash
stophy youtube search --query "bun runtime" --limit 5
stophy maps search --query dentist --near Berlin --country DE
stophy youtube search --help
```

`--help` lists each field, its type, whether it is required, enum values, and the credit cost. Flags come from the endpoint's JSON schema:

- strings, numbers, and integers are validated before the call
- booleans take `--flag` and `--no-flag`
- enums are checked against the allowed values
- arrays repeat (`--features live --features hd`) or take a comma list (`--features live,hd`)
- unknown flags error and list the valid ones

Markdown is the default (`Accept: text/markdown`). `--json` prints the `data` object and writes `credits used` to stderr. `--raw` prints the full JSON envelope.

## Discovery

```bash
stophy endpoints youtube
stophy describe youtube.search
stophy --refresh endpoints
```

`endpoints` prints credits and marks keyless endpoints as `free`. The catalog is cached for 5 minutes. A stale cache refreshes in the background. If the network is down, the CLI uses the cache and says so. `--refresh` forces a reload.

## Account

```bash
stophy usage
stophy logs --days 7 --endpoint youtube.search
```

`usage` and `logs` call `GET /v1/usage` and `GET /v1/logs` with your API key. There is no `credits` command: `GET /credits` requires a browser session, and `stophy login` stores an API key. The balance is included in `stophy usage` and `stophy status`.

## All commands

| Command | What it does |
|---------|-------------|
| `stophy init --all --browser` | Install the CLI, all agent skills, and authenticate |
| `stophy login` | Authenticate with API key or browser |
| `stophy endpoints [term]` | List catalog endpoints, credits, and free keyless calls |
| `stophy describe <id>` | Show one endpoint's input schema and cost |
| `stophy <source> <endpoint>` | Call that endpoint |
| `stophy usage` | Balance, credits used, and request count |
| `stophy logs` | Request logs for your API key |
| `stophy status` | Version, auth status, and balance |
| `stophy doctor` | Diagnose install, auth, and API connectivity |
| `stophy version` | CLI version and auth status |
| `stophy view-config` | Config and auth status |
| `stophy logout` | Clear saved credentials |

The CLI checks npm for a newer version in the background and prints a one-line notice when an update is available. Set `STOPHY_NO_UPDATE_CHECK=1` to disable it.

Each command supports `--help`. Full docs at [docs.stophy.dev](https://docs.stophy.dev).

## Also see

- [@stophy/mcp](https://www.npmjs.com/package/@stophy/mcp) — MCP server for AI agents
- [stophydotdev/skills](https://github.com/stophydotdev/skills) — agent skills for the CLI (`npx skills add stophydotdev/skills`)
- [stophy.dev](https://stophy.dev) — dashboard and API keys

## License

MIT
