---
name: stophy-video
description: Get full transcripts with timestamps, comments, replies, and metadata for any YouTube video. Use when the user provides a YouTube URL and says "get the transcript", "summarize this video", "what are people saying in the comments", or needs to analyze a specific video.
metadata:
  author: stophy
  version: "1.0.0"
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy video

Get details, transcript, comments, or replies for a YouTube video.

## Quick start

```bash
# Video metadata (title, views, description, channel)
stophy video details --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"

# Full transcript with timestamps
stophy video transcript --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"

# Top comments
stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --sortBy top

# Latest comments
stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --sortBy latest

# Paginate comments
stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --continuation-token <token>

# Replies to a comment (use repliesToken from comment response)
stophy video replies --continuation-token <repliesToken>
```

## Options

| Option | Values | Description |
|--------|--------|-------------|
| `--url <url>` | YouTube video URL | Required for details, transcript, comments |
| `--sortBy <sort>` | top, latest | Comment sort order |
| `--continuation-token <token>` | string | Paginate comments or fetch replies |
| `--json` | — | Print raw JSON |

## Response shapes

`details` returns `title`, `description`, `viewCount`, `likeCount`, `publishedAt`, `channel`, and `thumbnails`.

`transcript` returns `segments[]` with `{ text, start, duration }` and a `language` field.

`comments` returns `comments[]` with `{ text, author, likeCount, publishedAt, repliesToken }`. Pass `repliesToken` to `stophy video replies` to load the full thread.

## Tips

- Transcripts are only available for videos that have captions enabled.
- To read a full comment thread, use the `repliesToken` from a comment with `stophy video replies`.
- Pipe transcript text into your agent: `stophy video transcript --url <url> --json | jq '.data.segments[].text' -r`

## See also

- [stophy-search](../stophy-search/SKILL.md) — find videos before fetching content
- [stophy-channel](../stophy-channel/SKILL.md) — browse a channel's catalog
- [stophy-playlist](../stophy-playlist/SKILL.md) — process multiple videos from a playlist
