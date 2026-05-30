---
name: stophy-channel
description: Browse a YouTube channel's videos, shorts, playlists, and about page sorted by popularity or date. Use when the user provides a YouTube channel URL or @handle, says "show me videos from this channel", "what has @name uploaded recently", or needs to explore a creator's catalog.
metadata:
  author: stophy
  version: "0.1.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy channel

Browse a channel's videos, shorts, playlists, or about page.

## Quick start

```bash
# Latest videos from a channel
stophy channel --url "https://youtube.com/@fireship"

# Most popular videos (--sortBy only applies to --tab video)
stophy channel --url "https://youtube.com/@fireship" --tab video --sortBy popular

# Channel about page (subscriber count, description, links)
stophy channel --url "https://youtube.com/@fireship" --tab about

# Shorts
stophy channel --url "https://youtube.com/@fireship" --tab short

# Playlists
stophy channel --url "https://youtube.com/@fireship" --tab playlist

# Paginate
stophy channel --url "https://youtube.com/@fireship" --continuation-token <token>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--url <url>` | YouTube channel URL | Channel URL or @handle (required) |
| `--tab <tab>` | video, short, playlist, about | Which tab to fetch (default: video) |
| `--sortBy <sort>` | latest, popular, oldest | Sort order — only applies when `--tab video` |
| `--continuation-token <token>` | | Paginate from a previous response |

## Tips

- Use `--tab about` to get subscriber count, description, and social links without listing videos.
- Use `--tab video --sortBy popular` to surface a channel's highest-performing content. `--sortBy` has no effect on other tabs.
- Response includes a `continuationToken` when more results are available.

## See also

- [stophy-video](../stophy-video/SKILL.md) — get transcript or comments for a specific video
- [stophy-playlist](../stophy-playlist/SKILL.md) — fetch a specific playlist from the channel
