---
name: stophy-cli
description: |
  Extract YouTube data from the command line: search videos, get transcripts, read comments, browse channels, and fetch playlists. Use when the user wants YouTube data, says "find YouTube videos", "get the transcript", "what are people saying in the comments", "browse this channel", or provides a YouTube URL and needs its content. Requires a Stophy API key.
allowed-tools:
  - Bash(stophy *)
  - Bash(npx stophy *)
---

# stophy

YouTube data CLI. All output is JSON.

## Authentication

```bash
stophy login                      # interactive (browser or API key)
stophy login --browser            # browser login
stophy login --api-key st_xxx     # direct API key
```

Or set the environment variable: `STOPHY_API_KEY=st_xxx`

## Workflow

1. **Find videos** → `stophy search` — search by keyword, filter by date, type, or duration
2. **Read content** → `stophy video transcript` — full transcript with timestamps
3. **Read comments** → `stophy video comments` — top or latest comments
4. **Browse a channel** → `stophy channel` — all videos sorted by popularity or date
5. **Process a playlist** → `stophy playlist` — all videos with metadata

## Credits

Each command call uses one credit. Check balance with `stophy usage`.

## Skills

- [stophy-search](../stophy-search/SKILL.md) — search YouTube
- [stophy-video](../stophy-video/SKILL.md) — video details, transcript, comments
- [stophy-channel](../stophy-channel/SKILL.md) — browse channels
- [stophy-playlist](../stophy-playlist/SKILL.md) — fetch playlists
