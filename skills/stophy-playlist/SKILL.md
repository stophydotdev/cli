---
name: stophy-playlist
description: |
  Fetch all videos in a YouTube playlist with full metadata. Use when the user provides a YouTube playlist URL, says "get all videos in this playlist", "what's in this playlist", "list the videos from this course", or needs to process a curated collection of videos.
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy playlist

Get all videos in a playlist with full metadata.

## Quick start

```bash
# Fetch playlist
stophy playlist --url "https://youtube.com/playlist?list=PLxxxx"

# Paginate
stophy playlist --url "https://youtube.com/playlist?list=PLxxxx" --continuation-token <token>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--url <url>` | YouTube playlist URL | Playlist URL (required) |
| `--continuation-token <token>` | | Paginate from a previous response |

## Response

Returns `title`, `description`, `videoCount`, and `videos[]` — each with `title`, `url`, `duration`, `viewCount`, and `publishedAt`.

## Tips

- Response includes a `continuationToken` when there are more videos to load.
- Combine with `stophy video transcript` to process each video in a course or series.

## See also

- [stophy-video](../stophy-video/SKILL.md) — read individual videos from the playlist
- [stophy-channel](../stophy-channel/SKILL.md) — browse a channel to find its playlists
