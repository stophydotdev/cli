---
name: stophy-cli
description: Search, extract, and analyze YouTube data from the command line using the Stophy API. Use when the user wants YouTube content — transcripts, comments, search results, channels, or playlists — or provides a YouTube URL and needs its content analyzed.
metadata:
  author: stophy
  version: "1.0.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy-cli

YouTube data CLI. All output is JSON — pipe it into jq, scripts, or AI agents.

## Install

```bash
npm install -g stophy-cli
```

## Authentication

```bash
stophy login                      # interactive (browser or API key)
stophy login --browser            # browser login
stophy login --api-key st_xxx     # direct API key
export STOPHY_API_KEY="st_xxx"    # or set env var
```

## Commands

| Command | Description |
|---------|-------------|
| `stophy search` | Search YouTube by keyword with filters |
| `stophy suggest` | Get autocomplete suggestions for a query |
| `stophy video details` | Video metadata — title, views, description |
| `stophy video transcript` | Full transcript with timestamps |
| `stophy video comments` | Paginated comments, sorted by top or latest |
| `stophy video replies` | Replies to a comment thread |
| `stophy channel` | Browse a channel's videos, shorts, playlists, or about |
| `stophy playlist` | All videos in a playlist with full metadata |
| `stophy credits` | Check remaining credit balance (free) |
| `stophy usage` | API usage over a time range |
| `stophy logs` | Request logs for your key |
| `stophy view-config` | Show auth status and config path |
| `stophy logout` | Clear saved credentials |

## Workflow

1. **Find videos** → `stophy search` — search by keyword, filter by date, type, or duration
2. **Read content** → `stophy video transcript` — full transcript with timestamps
3. **Read comments** → `stophy video comments` — top or latest comments
4. **Browse a channel** → `stophy channel` — videos sorted by popularity or date
5. **Process a playlist** → `stophy playlist` — all videos with metadata

## Skills

- [stophy-search](../stophy-search/SKILL.md) — search YouTube
- [stophy-video](../stophy-video/SKILL.md) — video details, transcript, comments
- [stophy-channel](../stophy-channel/SKILL.md) — browse channels
- [stophy-playlist](../stophy-playlist/SKILL.md) — fetch playlists
