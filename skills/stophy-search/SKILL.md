---
name: stophy-search
description: |
  Search YouTube for videos, shorts, channels, or playlists by keyword. Use when the user wants to find YouTube content, says "search YouTube", "find videos about", "what are the top tutorials on", "find channels about", or needs to discover content before going deeper. Supports filtering by upload date, duration, type, and sort order.
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy search

Search YouTube by keyword with filters for type, date, and duration.

## Quick start

```bash
# Basic search
stophy search --q "react tutorial"

# Filter by type and sort by popularity
stophy search --q "typescript tutorial" --type video --sortBy popularity

# Recent results only
stophy search --q "next.js 15" --uploadDate week

# Long videos only
stophy search --q "docker tutorial" --duration long

# Paginate results
stophy search --q "machine learning" --continuation-token <token>
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
