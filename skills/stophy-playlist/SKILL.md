---
name: stophy-playlist
description: Fetch all videos in a YouTube playlist with full metadata including titles, durations, and view counts. Use when the user provides a YouTube playlist URL, says "what's in this playlist", "get all videos from this course", or needs to process a curated collection of videos.
metadata:
  author: stophy
  version: "1.0.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy playlist

Get all videos in a playlist with full metadata.

## Quick start

```bash
# Fetch playlist
stophy playlist --url "https://www.youtube.com/playlist?list=PLxxxxxx"

# Paginate
stophy playlist --url "https://www.youtube.com/playlist?list=PLxxxxxx" --continuation-token <token>

# Extract all video titles
stophy playlist --url "https://www.youtube.com/playlist?list=PLxxxxxx" --json \
  | jq '.data.videos[].title' -r
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--url <url>` | YouTube playlist URL | Required |
| `--continuation-token <token>` | string | Paginate from a previous response |
| `--json` | — | Print raw JSON |

## Response

Returns `title`, `description`, `videoCount`, and `videos[]`. Each video has `title`, `url`, `duration`, `viewCount`, and `publishedAt`.

## Tips

- Response includes a `continuationToken` when there are more videos to load.
- Combine with `stophy video transcript` to process every video in a course or series.

## See also

- [stophy-video](../stophy-video/SKILL.md) — read individual videos from the playlist
- [stophy-channel](../stophy-channel/SKILL.md) — browse a channel to find its playlists
