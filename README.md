# Stophy CLI

The web data layer for AI agents, in your terminal. Live web data as typed JSON for AI agents. Search, video, social, jobs, places, property and ads behind one key, with a price shown before every call. You pay only for answers that come back. Results print as readable rows, or as JSON with `--json`.

## Get started

Run one command to log in, add the Stophy skills to your AI agents, and add the Stophy MCP server:

```bash
npx -y @stophy/cli init --all
```

`init` runs three steps in order:

1. Logs you in with your browser, unless you are already logged in.
2. Installs the Stophy skills with `npx -y skills add stophydotdev/skills`.
3. Adds the MCP server. With Claude Code on your PATH it runs `claude mcp add`. For any other agent it prints the exact command or snippet to use, and does not edit your config files.

| Option | What it does |
| --- | --- |
| `--all` | Run every step without asking |
| `--agent <name>` | Set up one agent, such as `claude-code` or `codex` |
| `--skip-auth` | Do not log in |
| `--skip-skills` | Do not install the skills |
| `--skip-mcp` | Do not add the MCP server |

When it finishes, `init` prints a summary and a first command to try. To run `stophy ...` commands directly, install the CLI as described below.

## Install

Install with npm. You need Node.js 20 or later.

```bash
npm install -g @stophy/cli
```

To install without Node.js, use the standalone binary:

```bash
# macOS and Linux
curl -fsSL https://stophy.dev/install.sh | bash

# Windows (PowerShell)
irm https://stophy.dev/install.ps1 | iex
```

## Log in

```bash
stophy login --browser
```

The CLI prints a code and opens stophy.dev. Check that the page shows the same code, then click **Approve**.

On a server with no browser, open the printed link on any other device. The server logs in when you approve.

To use an API key instead, get one from the [dashboard](https://stophy.dev/dashboard) and pass it in one of two ways:

```bash
stophy login --api-key st_...
export STOPHY_API_KEY="st_..."
```

Each computer gets its own key. Logging in again on the same computer replaces its key. To log out and revoke the key, run `stophy logout`.

## Get data

Name the source, then the command:

```bash
stophy youtube search "bun runtime" --limit 5
stophy maps search --query dentist --location Berlin
stophy reddit subreddit rust
stophy transcript https://youtu.be/M4TufsFlv_o
stophy tiktok profile tiktok --limit 5
stophy ads search nike --network meta
```

To see what a source can do, run `stophy <source> --help`. To see every option for a command, run `stophy <source> <command> --help`.

Options work like this:

- Give an option once, or give a list as `--features live,hd` or `--features live --features hd`.
- Turn a yes-or-no option on with `--flag` and off with `--no-flag`.
- When a command needs a choice such as `--network`, `--source` or `--by`, give it as an option.
- If you give a value the command does not accept, the CLI stops before it calls Stophy and says which values work.

To change the output:

- By default, lists print one row per result with its title and link. Other results print as `name: value` lines.
- `--json` prints the data as JSON and prints the credits used to stderr.
- `--raw` prints the full response, including its request id.
- `-o <path>` writes the output to a file.

`--limit` keeps at most that many results from a page and costs the same. When there are more results, the output ends with a cursor. To get the next page, run the same command with `--cursor <cursor>`.

`stophy web search` works without logging in. Every other command needs a login or an API key.

When a request fails, the error ends with `Request id: <id>`. Include it when you report a problem.

## Check your account

```bash
stophy status
stophy usage
stophy logs --days 7
```

`status` shows your login and balance. `usage` shows your balance and your all-time usage. `logs` shows your recent requests.

## Commands

| Command | What it does |
| --- | --- |
| `stophy init` | Log in, install the agent skills, and add the MCP server |
| `stophy login` | Log in with your browser or an API key |
| `stophy logout` | Log out and revoke this computer's key |
| `stophy <source> <command>` | Get data, for example `stophy youtube search` |
| `stophy endpoints [word]` | List every command and its cost |
| `stophy status` | Show your login, balance, and CLI version |
| `stophy usage` | Show your balance and all-time usage |
| `stophy logs` | Show your recent requests |
| `stophy doctor` | Check your install, login, and connection |
| `stophy version` | Show the CLI version |

The CLI tells you when a newer version is available. To turn off the check, set `STOPHY_NO_UPDATE_CHECK=1`.

## More

- [Stophy docs](https://docs.stophy.dev)
- [Agent skills for the CLI](https://github.com/stophydotdev/skills): `npx skills add stophydotdev/skills`
- [Dashboard and API keys](https://stophy.dev/dashboard)

## License

MIT
