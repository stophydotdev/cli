---
name: stophy-search
description: Search YouTube for videos, shorts, channels, or playlists by keyword with filters for date, duration, type, and sort order. Use when the user says "search YouTube", "find videos about X", "what are the top videos on X", or needs to discover content before going deeper.
metadata:
  author: stophy
  version: "1.0.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy search

Search YouTube by keyword with filters for type, date, duration, and sort order.

## Quick start

```bash
# Basic search
stophy search --q "how to build a SaaS"

# Filter by type and sort by views
stophy search --q "Claude Code" --type video --sortBy viewCount

# Recent results only
stophy search --q "AI news" --uploadDate week

# Long-form content only
stophy search --q "Python for beginners" --duration long

# Paginate results
stophy search --q "typescript" --continuation-token <token>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--q <query>` | any | Search query (required) |
| `--type <type>` | video, channel, playlist | Content type filter |
| `--sortBy <sort>` | relevance, uploadDate, viewCount, rating | Sort order |
| `--uploadDate <date>` | hour, today, week, month, year | Upload recency filter |
| `--duration <duration>` | short, medium, long | Under 4 min / 4–20 min / over 20 min |
| `--continuation-token <token>` | string | Paginate from a previous response |
| `--json` | — | Print raw JSON |

## Tips

- Use `--sortBy viewCount` to surface the most-watched content on a topic.
- Use `--uploadDate week` for the latest uploads on a fast-moving topic.
- The response includes a `continuationToken` for fetching the next page.
- Combine with `stophy suggest` to expand a partial query before searching.

## See also

- [stophy-video](../stophy-video/SKILL.md) — get transcript or comments after finding a video
- [stophy-channel](../stophy-channel/SKILL.md) — browse a specific channel's content
