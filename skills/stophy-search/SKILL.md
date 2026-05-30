---
name: stophy-search
description: Search YouTube for videos, shorts, channels, or playlists by keyword with filters for date, duration, type, and sort order. Use when the user says "search YouTube", "find videos about X", "what are the top videos on X", or needs to discover content before going deeper.
metadata:
  author: stophy
  version: "0.1.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy search

Search YouTube by keyword with filters for type, date, and duration.

## Quick start

```bash
# Basic search
stophy search --q "How to make money in 2026"

# Filter by type and sort by popularity
stophy search --q "Claude Code" --type video --sortBy popularity

# Recent results only
stophy search --q "Hermes Agent" --uploadDate week

# Long videos only
stophy search --q "Python for beginners" --duration long

# Paginate results
stophy search --q "Typescript for dummies" --continuation-token <token>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--q <query>` | any | Search query (required) |
| `--type <type>` | video, short, channel, playlist, movie | Content type |
| `--sortBy <sort>` | relevance, popularity, date, rating | Sort order |
| `--uploadDate <date>` | today, week, month, year | Upload recency filter |
| `--duration <duration>` | short, medium, long | Under 3 min / 3-20 min / over 20 min |
| `--continuation-token <token>` | | Paginate from a previous response |

## Tips

- Use `--sortBy popularity` to find the most-watched content on a topic.
- Use `--uploadDate week` combined with `--sortBy date` for the latest uploads.
- The response includes a `continuationToken` for fetching the next page.

## See also

- [stophy-video](../stophy-video/SKILL.md) — get transcript or comments after finding a video
- [stophy-channel](../stophy-channel/SKILL.md) — browse a specific channel's content
