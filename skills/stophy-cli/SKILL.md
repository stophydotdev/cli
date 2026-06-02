---
name: stophy-cli
description: YouTube for AI Agents. Use when the user wants YouTube content — transcripts, comments, search results, channels, or playlists — or provides a YouTube URL and needs its content analyzed.
metadata:
  author: stophy
  version: "1.0.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# @stophy/cli

YouTube for AI Agents. All output is JSON. Pipe it into jq, scripts, or agents.

## Install

```bash
npm install -g @stophy/cli
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
| `stophy suggest` | Autocomplete suggestions for a query |
| `stophy video details` | Video metadata |
| `stophy video transcript` | Full transcript with timestamps |
| `stophy video comments` | Paginated comments, sorted by top or latest |
| `stophy video replies` | Replies to a comment thread |
| `stophy channel` | Channel videos, shorts, playlists, or about |
| `stophy playlist` | All videos in a playlist with full metadata |
| `stophy credits` | Remaining credit balance (free) |
| `stophy usage` | API usage over a time range |
| `stophy logs` | Request logs for your key |
| `stophy view-config` | Auth status and config path |
| `stophy logout` | Clear saved credentials |

## Workflow

Search by keyword with `stophy search`, then pull transcripts with `stophy video transcript`, comments with `stophy video comments`, or browse a full channel with `stophy channel`.

## Skills

- [stophy-search](../stophy-search/SKILL.md) — search YouTube
- [stophy-video](../stophy-video/SKILL.md) — video details, transcript, comments
- [stophy-channel](../stophy-channel/SKILL.md) — browse channels
- [stophy-playlist](../stophy-playlist/SKILL.md) — fetch playlists
