# @stophy/cli

The Stophy command-line client — web data for AI agents. It loads `GET /v1/endpoints` and turns each endpoint into `stophy <source> <endpoint words>`, posting the JSON body to `POST /v1/<source>/<endpoint>`. Output is markdown by default. Written in TypeScript as an **ESM** package, compiled with `tsc` to `dist/`, published to npm as `@stophy/cli` and shipped as standalone binaries.

## Layout

```
src/
  index.ts             # entry: loads the catalog, registers commands, auth hook
  argv.ts              # global --refresh, command words, flag tokens
  catalog.ts           # GET /v1/endpoints, 5 minute cache, background refresh
  flags.ts             # JSON schema → flags, validation, help, describe, endpoints list
  invoke.ts            # one catalog call: markdown, --json, or --raw
  client.ts            # request(): the single HTTP path to the Stophy API
  config.ts            # load/save/resolve credentials + base URLs; key validation
  errors.ts            # CliError + toCliError; the only error type commands throw
  output.ts            # handleOutput / writeOutput
  account.ts           # zod schemas for /v1/usage and /v1/logs
  color.ts             # green() — thin wrapper over chalk
  spinner.ts           # createSpinner / withSpinner — wrappers over ora (stderr)
  npm-registry.ts      # getLatestVersion / compareVersions (used by doctor)
  update-notice.ts     # background "newer version available" banner (update-notifier)
  browser-login.ts     # PKCE init/poll against the Stophy auth endpoints
  prompt-login.ts      # interactive login (prompts) + browser open (open)
  commands/
    dynamic.ts         # registers stophy <source> <endpoint words>
    endpoints.ts       # stophy endpoints [term]
    describe.ts        # stophy describe <id>
    usage.ts           # GET /v1/usage (API key)
    logs.ts            # GET /v1/logs (API key)
    status.ts          # version, auth, balance
    doctor.ts          # diagnostics
    login.ts init.ts account.ts version.ts
  types/
    api.ts             # success envelope zod schema, OutputOptions
    init.ts
scripts/
  build-binaries.sh    # bun --compile cross-build for all targets
  install.sh           # curl|bash installer (macOS/Linux)
  install.ps1          # PowerShell installer (Windows)
homebrew/
  stophy.rb            # Homebrew formula
.github/workflows/
  publish.yml          # tokenless npm publish via trusted publishing
  version.yml          # Changesets version PR on main
  release-binaries.yml # build + attach binaries on tag
  test.yml             # build + biome check on PR
.changeset/
  config.json          # Changesets release config
  README.md            # local release workflow notes
nfpm.yaml              # deb/rpm/apk/archlinux packaging
biome.json             # lint + format config (tabs, double quotes)
tsconfig.json          # ESM (NodeNext), ES2022, outputs to dist/
AGENTS.md              # this file
CLAUDE.md              # @AGENTS.md (cross-agent include)
```

## Conventions

- **Language & build.** TypeScript only, **ESM** (`"type": "module"`, `module`/`moduleResolution` = `NodeNext`). `tsc` compiles `src/` → `dist/` (ES2022). The bin `stophy` points at `dist/index.js`. Never edit `dist/` by hand; never commit it.
- **ESM import rules.** Relative imports **must** carry the `.js` extension (e.g. `import { request } from "./client.js"`) — that's the compiled path, even though the source is `.ts`. JSON imports need an import attribute: `import packageJson from "../package.json" with { type: "json" }`. Prefer named exports; default-import the libraries that ship that way (`chalk`, `ora`, `open`, `Conf`, `updateNotifier`).
- **Dependencies.** Runtime deps are deliberate and few: `commander` (CLI), `chalk` (color), `ora` (spinner), `open` (browser launch), `prompts` (interactive login), `conf` (config storage), `update-notifier` (update check), `zod` (parse catalog, envelopes, usage, and logs at the boundary). Don't reach for a new dependency when one of these or a Node built-in (`fetch`, `node:fs`, `node:crypto`) covers it; every dep also has to bundle cleanly into the `bun --compile` binary.
- **Lint & format.** Biome, with tabs and double quotes. Run `bun run check` (or `bunx biome check ./src`) after every change; use `bunx biome check --write ./src` to apply fixes. Do not add Prettier, ESLint, or husky.
- **Branches & commits.** Work on a new branch for each change; do not make normal feature, fix, or release-infra commits directly on `main`. Use Conventional Commit style: `<type>(<scope>): <summary>` (for example, `feat(ci): change release workflow`). Keep the summary imperative, lowercase, and concise.
- **Imports.** Use `import type { ... }` for type-only imports. Keep imports sorted (Biome enforces this on `--write`).
- **Errors.** Commands throw `CliError` (from `src/errors.ts`) for anything user-facing — never `process.exit` inside a command body. `index.ts` catches, prints `error.message`, and exits with `error.exitCode`. Wrap unknown errors with `toCliError`.
- **HTTP.** Every API call goes through `request()` in `src/client.ts`. Do not call `fetch` directly from a command. Parse JSON with zod at the boundary. Do not add `as` casts.
- **Output.** Catalog calls print markdown to stdout by default. `--json` prints the envelope `data` and writes `credits used: N` to stderr. `--raw` prints the full envelope. `-o, --output <file>` writes that same stdout payload to disk and confirms on stderr.
- **Versions.** 2.0.0 is the catalog release. All changesets after 2.0.0 are `patch`, never `minor` or `major`, unless Hussein says otherwise.
- **Color.** Color is TTY/`NO_COLOR`/`FORCE_COLOR`-gated. The brand accent is Stophy green `#006239`, written as the truecolor sequence `\x1b[38;2;0;98;57m`. Status dots are semantic (green = ok, yellow = warn, red = fail). Never hardcode the brand color as red or any other hue.
- **Secrets.** API keys are `st_xxx` tokens. Never log, print in full, or commit them. Mask as `st_...<last4>` (see `doctor.ts`). Config lives under `~/.config/stophy/`. The endpoint cache is `catalog.json` in that same directory.

## Catalog commands

Data commands are not hand-written. `src/commands/dynamic.ts` builds `stophy <source> <endpoint words>` from each catalog id (`youtube.comments.replies` → `youtube comments replies`). `src/flags.ts` turns the input JSON schema into flags. To change how a call works, change those two files, not a per-endpoint command file.

`GET /v1/endpoints` is cached for 5 minutes. A stale cache is used immediately and refreshed in the background. If that refresh fails, the command warns and keeps the cache. `--refresh` forces a blocking reload.

Keyless endpoints skip the login prompt. Everything else needs an API key or a saved session before `preAction` continues.

## Adding a static command

Static commands are the ones that are not catalog endpoints: `login`, `init`, `endpoints`, `describe`, `usage`, `logs`, `status`, `doctor`, `version`, `view-config`, `logout`.

1. Create `src/commands/<name>.ts` exporting `register<Name>Command(program: Command)`.
2. Call `request()` for any HTTP. Parse the body with zod.
3. Register it in `src/index.ts`. If the command name is also a legal catalog source id, add it to `RESERVED` in `src/commands/dynamic.ts`.
4. If it must work without credentials, add its name to `NO_AUTH_COMMANDS` in `src/index.ts`.
5. Add a row to the command table in `README.md`.
6. Add a changeset with `bun run changeset`. After 2.0.0 that changeset is `patch` unless Hussein says otherwise.
7. Run `bun run test && bun run build && bun run check`.

## The request path (`src/client.ts`)

`request(options)` resolves credentials, builds the URL against the configured `baseUrl`, sends `Authorization: Bearer` and/or the session cookie, and returns `{ status, text, json }`. On non-2xx it throws `CliError` with the server `error.message` (or a legacy string `error`) and `Retry-After` when present.

Catalog calls send `Accept: text/markdown` unless the user passed `--json` or `--raw`. The JSON envelope is `{ success, data, creditsUsed, requestId }` (`successEnvelope` in `src/types/api.ts`). `GET /v1/usage` and `GET /v1/logs` are not envelopes; their zod schemas live in `src/account.ts`.

`GET /credits` (and the session `/usage` and `/logs` routes) require a browser session via `requireSession`. `stophy login` stores an API key, not a session cookie, so the CLI does not call those routes. Balance comes from `GET /v1/usage`.

## Config & auth (`src/config.ts`)

`resolveRuntimeConfig()` is the single source of truth for `apiKey`, `sessionCookie`, `baseUrl`, and their source. Precedence is env (`STOPHY_API_KEY`) over stored config. `STOPHY_BASE_URL` overrides the stored base URL. Storage is backed by **`conf`** (configured with `projectSuffix: ""` so the path stays `~/.config/stophy/config.json`); `saveConfig` re-asserts `0600` on the file since `conf` doesn't. `getConfigPath()` returns `conf`'s resolved path. `DEFAULT_BASE_URL` is `https://api.stophy.dev`; `DEFAULT_FRONTEND_URL` is `https://stophy.dev`. Use `validateApiKey` / `normalizeApiKey` rather than re-checking the `st_` prefix inline.

Browser login (`/api/cli/init`, `/status`, `/session`, `/complete`) still returns an API key. That key is what later calls send.

## Output (`src/output.ts`)

- `handleOutput(value, options)` — pretty JSON to stdout, or to a file when `options.output` is set.
- `writeOutput(content, output?, silent?)` — write a raw string to a file (creating parent dirs) or stdout; file writes confirm on stderr.

## Version & update plumbing

- `npm-registry.ts` — `getLatestVersion(packageName)` and `compareVersions(a, b)`, used by `doctor`'s explicit version/reachability check.
- `update-notice.ts` — `maybeShowUpdateNotice()`, called at the end of `main()`. Backed by `update-notifier` (it owns the background check, caching, and throttling). stderr/TTY-only, disabled by `STOPHY_NO_UPDATE_CHECK=1`.
- `version` / `status` / `doctor` — diagnostics. `version` and `doctor` are in `NO_AUTH_COMMANDS`. `doctor` checks the key with `GET /v1/usage`.

## Changesets

Changesets owns release intent and version bumps.

- Add a changeset with `bun run changeset` for any user-facing CLI, README, install, auth, output, packaging, or dependency behavior change.
- Do not add a changeset for CI-only maintenance, comments, tests that do not change behavior, or internal refactors with no user-visible effect.
- The generated `.changeset/*.md` file must be committed with the feature change.
- On `main`, `.github/workflows/version.yml` creates or updates the `Version Packages` PR.
- Merging the version PR applies `changeset version`, updates `package.json`, creates/updates `CHANGELOG.md`, and removes consumed changeset files.
- Do not hand-edit `CHANGELOG.md` for normal releases; edit the changeset text before the version PR is generated.
- **After 2.0.0, every changeset is `patch`. Never `minor` or `major`, unless Hussein says otherwise.**

## Distribution

- `bun run build:binary` (`scripts/build-binaries.sh`) cross-compiles standalone binaries via `bun build --compile`, named `stophy-<os>-<arch>`.
- `scripts/install.sh` / `install.ps1` are the `curl|bash` / `irm|iex` installers; they fetch release binaries from the GitHub releases of `stophydotdev/cli`.
- `homebrew/stophy.rb` and `nfpm.yaml` cover Homebrew and Linux package managers.
- GitHub Actions: `test.yml` (PR build + lint), `version.yml` (Changesets version PR), `publish.yml` (npm trusted publishing, no npm token), `release-binaries.yml` (binaries and Linux packages on version tag).
- npm trusted publishing must point at `.github/workflows/publish.yml`. Do not reintroduce `NPM_TOKEN` / `NODE_AUTH_TOKEN` for the normal publish path.

## package.json

`files` ships only `dist` and `README.md`. `bin.stophy` → `dist/index.js`. `prepublishOnly` runs the build. `version` is updated by Changesets, not by hand for normal releases. Keep the `description` aligned with the README tagline.

## Related

- `README.md` — human-facing install, auth, and command reference.
- `src/types/api.ts` — the success envelope catalog calls parse.
- The skills repo (`stophydotdev/skills`) — agent skills that drive this CLI; keep command names and flags in sync with what those skills invoke.
