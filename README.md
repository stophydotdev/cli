# Stophy CLI

Get public web data from your terminal: search results, videos, social posts, places, products, jobs, homes, and more. Results print as markdown, or as JSON with `--json`.

## Get started

Run one command to install the CLI, add the Stophy skills to your AI agents, and log in:

```bash
npx -y @stophy/cli@latest init --all --browser
```

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
stophy maps search dentist --near Berlin --country de
stophy reddit subreddit rust
```

To see what a source can do, run `stophy <source> --help`. To see every option for a command, run `stophy <source> <command> --help`.

Options work like this:

- Give an option once, or give a list as `--features live,hd` or `--features live --features hd`.
- Turn a yes-or-no option on with `--flag` and off with `--no-flag`.
- If you give a value the command does not accept, the CLI stops before it calls Stophy and says which values work.

To change the output:

- `--json` prints the data as JSON and prints the credits used to stderr.
- `-o <path>` writes the output to a file.

When there are more results, the output ends with a cursor. To get the next page, run the same command with `--cursor <cursor>`.

`web search`, `youtube search`, and `youtube transcript` work without logging in.

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
| `stophy init --all --browser` | Install the CLI and the agent skills, and log in |
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
