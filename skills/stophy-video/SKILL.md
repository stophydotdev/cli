---
name: stophy-video
description: Get full transcripts with timestamps, comments, replies, and metadata for any YouTube video. Use when the user provides a YouTube URL and says "get the transcript", "summarize this video", "what are people saying in the comments", or needs to analyze a specific video.
metadata:
  author: stophy
  version: "0.1.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy video

Get details, transcript, comments, or replies for a YouTube video.

## Quick start

```bash
# Video metadata (title, views, description, channel)
stophy video details --url "https://www.youtube.com/watch?v=kK-iR6g-V1g"

# Full transcript with timestamps
stophy video transcript --url "https://www.youtube.com/watch?v=kK-iR6g-V1g"

# Top comments
stophy video comments --url "https://www.youtube.com/watch?v=kK-iR6g-V1g" --sortBy top

# Latest comments
stophy video comments --url "hhttps://www.youtube.com/watch?v=kK-iR6g-V1g" --sortBy latest

# Paginate comments
stophy video comments --url "https://www.youtube.com/watch?v=kK-iR6g-V1g" --continuation-token <token>

# Replies to a comment (use repliesToken from comment response)
stophy video replies --continuation-token <repliesToken>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--url <url>` | YouTube video URL | Required for details, transcript, comments |
| `--sortBy <sort>` | top, latest | Comment sort order |
| `--continuation-token <token>` | | Paginate comments or fetch replies |

## Response shapes

**details**: `title`, `description`, `viewCount`, `likeCount`, `publishedAt`, `channel`, `thumbnails`

**transcript**: `segments[]` with `{ text, start, duration }` and a `language` field

**comments**: `comments[]` with `{ text, author, likeCount, publishedAt, repliesToken }` — pass `repliesToken` to `stophy video replies` to load the thread

## Tips

- Always use the full YouTube URL (e.g., `https://youtube.com/watch?v=...`).
- Transcripts are only available for videos that have captions enabled.
- To read a comment thread, use the `repliesToken` from the comment object with `stophy video replies`.

## See also

- [stophy-search](../stophy-search/SKILL.md) — find videos before fetching content
- [stophy-channel](../stophy-channel/SKILL.md) — browse a channel's catalog
- [stophy-playlist](../stophy-playlist/SKILL.md) — process multiple videos from a playlist
