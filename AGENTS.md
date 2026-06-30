# @stophy/cli

The Stophy command-line client — YouTube context for AI agents. It wraps the Stophy API (search, suggest, video details/transcript/comments/livechat, channel, playlist) and the account endpoints (credits, usage, logs) as `stophy <command>`, emitting structured JSON for agents and humans. Written in TypeScript as an **ESM** package, compiled with `tsc` to `dist/`, published to npm as `@stophy/cli` and shipped as standalone binaries.

## Layout

```
src/
  index.ts             # entry: builds the program, registers commands, auth hook
  client.ts            # request<T>(): the single HTTP path to the Stophy API
  config.ts            # load/save/resolve credentials + base URLs; key validation
  errors.ts            # CliError + toCliError; the only error type commands throw
  output.ts            # handleOutput / writeOutput / table renderers
  color.ts             # green() — thin wrapper over chalk
  spinner.ts           # createSpinner / withSpinner — wrappers over ora (stderr)
  npm-registry.ts      # getLatestVersion / compareVersions (used by doctor)
  update-notice.ts     # background "newer version available" banner (update-notifier)
  browser-login.ts     # PKCE init/poll against the Stophy auth endpoints
  prompt-login.ts      # interactive login (prompts) + browser open (open)
  commands/
    <name>.ts          # one file per top-level command; exports register<Name>Command
  types/
    api.ts             # ApiSuccess<T> / ApiFailure envelope, OutputOptions, Thumbnail
    <name>.ts          # per-command Options + response Data types
scripts/
  build-binaries.sh    # bun --compile cross-build for all targets
  install.sh           # curl|bash installer (macOS/Linux)
  install.ps1          # PowerShell installer (Windows)
homebrew/
  stophy.rb            # Homebrew formula
.github/workflows/
  publish.yml          # npm publish on release
  release-binaries.yml # build + attach binaries on tag
  test.yml             # build + biome check on PR
nfpm.yaml              # deb/rpm/apk/archlinux packaging
biome.json             # lint + format config (tabs, double quotes)
tsconfig.json          # ESM (NodeNext), ES2022, outputs to dist/
AGENTS.md              # this file
CLAUDE.md              # @AGENTS.md (cross-agent include)
```

## Conventions

- **Language & build.** TypeScript only, **ESM** (`"type": "module"`, `module`/`moduleResolution` = `NodeNext`). `tsc` compiles `src/` → `dist/` (ES2022). The bin `stophy` points at `dist/index.js`. Never edit `dist/` by hand; never commit it.
- **ESM import rules.** Relative imports **must** carry the `.js` extension (e.g. `import { request } from "./client.js"`) — that's the compiled path, even though the source is `.ts`. JSON imports need an import attribute: `import packageJson from "../package.json" with { type: "json" }`. Prefer named exports; default-import the libraries that ship that way (`chalk`, `ora`, `open`, `Conf`, `updateNotifier`).
- **Dependencies.** Runtime deps are deliberate and few: `commander` (CLI), `chalk` (color), `ora` (spinner), `open` (browser launch), `prompts` (interactive login), `conf` (config storage), `update-notifier` (update check). Don't reach for a new dependency when one of these or a Node built-in (`fetch`, `node:fs`, `node:crypto`) covers it; every dep also has to bundle cleanly into the `bun --compile` binary.
- **Lint & format.** Biome, with tabs and double quotes. Run `bun run check` (or `bunx biome check ./src`) after every change; use `bunx biome check --write ./src` to apply fixes. Do not add Prettier, ESLint, or husky.
- **Imports.** Use `import type { ... }` for type-only imports. Keep imports sorted (Biome enforces this on `--write`).
- **Errors.** Commands throw `CliError` (from `src/errors.ts`) for anything user-facing — never `process.exit` inside a command body. `index.ts` catches, prints `error.message`, and exits with `error.exitCode`. Wrap unknown errors with `toCliError`.
- **HTTP.** Every API call goes through `request<T>()` in `src/client.ts`. Do not call `fetch` directly from a command (the one exception is `doctor`'s `pingCredits`, which deliberately bypasses the envelope check to report raw HTTP status). The API envelope is `ApiSuccess<T>` / `ApiFailure` in `src/types/api.ts` — `{ success, data, requestId?, cacheState?, creditsUsed?, creditsRemaining? }`. Read payload from `result.body.data`.
- **Output.** Data commands print pretty JSON to stdout by default. Route through `handleOutput(value, options)` / `writeOutput(content, output)` from `src/output.ts` so the shared `--json` and `-o, --output <file>` flags work. File writes go to disk; a confirmation goes to **stderr** so piped stdout stays clean.
- **Color.** Color is TTY/`NO_COLOR`/`FORCE_COLOR`-gated. The brand accent is Stophy green `#006239`, written as the truecolor sequence `\x1b[38;2;0;98;57m`. Status dots are semantic (green = ok, yellow = warn, red = fail). Never hardcode the brand color as red or any other hue.
- **Secrets.** API keys are `st_xxx` tokens. Never log, print in full, or commit them. Mask as `st_...<last4>` (see `doctor.ts`). Config lives under `~/.config/stophy/`.

## Adding a command

1. Create `src/commands/<name>.ts` exporting `register<Name>Command(program: Command)`. Define the command, its flags, `--json`, `-o, --output <file>`, and an `addHelpText("after", ...)` examples block.
2. Create `src/types/<name>.ts` with a `<Name>Options` interface (the parsed flags) and the response `Data` type(s). Derive shapes from the real API response, not assumptions.
3. Call `request<YourData>(...)` inside the action — wrap network calls in `withSpinner("…", () => request(...))` (from `src/spinner.js`) so long fetches show progress on stderr. Read from `result.body.data`; pass the result through `handleOutput` / `writeOutput`.
4. Register it in `src/index.ts` (add the import and the `register…(program)` call, keeping the grouping consistent with the existing list).
5. If the command must work **without** credentials, add its name to `NO_AUTH_COMMANDS` in `src/index.ts`. Otherwise the `preAction` hook prompts for login.
6. Add a row to the command table and (if user-facing) an example section in `README.md`.
7. Run `bun run build && bun run check`.

## Editing a command

Edit `src/commands/<name>.ts` and its `src/types/<name>.ts` together — keep the Options interface in sync with the registered flags, and the Data types in sync with the live API. If you change a flag name or output shape, update the `addHelpText` examples and the matching `README.md` section in the same change. Rebuild and lint.

## Removing a command

1. Delete `src/commands/<name>.ts` and `src/types/<name>.ts` (unless the type file is shared).
2. Remove the import and `register…` call from `src/index.ts`, and drop it from `NO_AUTH_COMMANDS` if present.
3. Remove its row and example from `README.md`.
4. Rebuild and lint to confirm nothing else imported it.

## The request path (`src/client.ts`)

`request<T>(options)` resolves credentials, builds the URL against the configured `baseUrl`, sends `Authorization: Bearer` and/or the session cookie, parses JSON, and validates the envelope. On non-2xx it throws a `CliError` carrying the server `error` string and rate-limit headers. On a 2xx with a malformed body it throws "unexpected response shape." Add new request behavior here, not in commands.

## Config & auth (`src/config.ts`)

`resolveRuntimeConfig()` is the single source of truth for `apiKey`, `sessionCookie`, `baseUrl`, and their source. Precedence is env (`STOPHY_API_KEY`) over stored config. Storage is backed by **`conf`** (configured with `projectSuffix: ""` so the path stays `~/.config/stophy/config.json`); `saveConfig` re-asserts `0600` on the file since `conf` doesn't. `getConfigPath()` returns `conf`'s resolved path. `DEFAULT_BASE_URL` is `https://api.stophy.dev`; `DEFAULT_FRONTEND_URL` is `https://stophy.dev`. Use `validateApiKey` / `normalizeApiKey` rather than re-checking the `st_` prefix inline.

## Output (`src/output.ts`)

- `handleOutput(value, options)` — pretty JSON to stdout, or to a file when `options.output` is set. The default for data commands.
- `writeOutput(content, output?, silent?)` — write a raw string to a file (creating parent dirs) or stdout; file writes confirm on stderr.
- `printUsage` / `printLogs` — table renderers that fall back to `handleOutput` when `--json` or `--output` is set.

## Version & update plumbing

- `npm-registry.ts` — `getLatestVersion(packageName)` and `compareVersions(a, b)`, used by `doctor`'s explicit version/reachability check.
- `update-notice.ts` — `maybeShowUpdateNotice()`, called at the end of `main()`. Backed by `update-notifier` (it owns the background check, caching, and throttling). stderr/TTY-only, disabled by `STOPHY_NO_UPDATE_CHECK=1`.
- `version` / `status` / `doctor` commands — diagnostics; all three are in `NO_AUTH_COMMANDS`.

## Distribution

- `bun run build:binary` (`scripts/build-binaries.sh`) cross-compiles standalone binaries via `bun build --compile`, named `stophy-<os>-<arch>`.
- `scripts/install.sh` / `install.ps1` are the `curl|bash` / `irm|iex` installers; they fetch release binaries from the GitHub releases of `stophydotdev/cli`.
- `homebrew/stophy.rb` and `nfpm.yaml` cover Homebrew and Linux package managers.
- GitHub Actions: `test.yml` (PR build + lint), `publish.yml` (npm on release), `release-binaries.yml` (binaries on tag).

## package.json

`files` ships only `dist` and `README.md`. `bin.stophy` → `dist/index.js`. `prepublishOnly` runs the build. Bump `version` for any user-visible change; keep the `description` aligned with the README tagline.

## Related

- `README.md` — human-facing install, auth, and command reference.
- `src/types/api.ts` — the API envelope every command depends on.
- The skills repo (`stophydotdev/skills`) — agent skills that drive this CLI; keep command names and flags in sync with what those skills invoke.
