# stophy

CLI for the [Stophy](https://stophy.dev) YouTube data API — search, transcripts, comments, channel data, trending, playlists, and shorts. All through one CLI, all returning clean JSON.

## Install

```
npm install -g stophy
# or
bun install -g stophy
```

## Quick start

```
stophy login --browser
stophy search --q "machine learning tutorial" --type video
stophy video transcript --url "https://youtube.com/watch?v=..."
stophy channel --url "https://youtube.com/@vercel"
stophy trending --category music
```

## Commands

| Command | Description |
|---------|-------------|
| `stophy login` | Authenticate with your Stophy account |
| `stophy search` | Search YouTube (videos, shorts, channels) |
| `stophy video details` | Get video metadata |
| `stophy video transcript` | Fetch timestamped transcript |
| `stophy video comments` | Fetch paginated comments |
| `stophy video replies` | Fetch comment replies |
| `stophy channel` | Channel profile and content tabs |
| `stophy playlist` | All videos in a playlist |
| `stophy trending` | Trending feeds by category/region |
| `stophy shorts` | Shorts discovery feed |
| `stophy usage` | API usage stats |
| `stophy logs` | Request logs |
| `stophy view-config` | Show config |
| `stophy logout` | Clear credentials |

See the [full docs](https://docs.stophy.dev) for options and response shapes.

## Auth

```
stophy login --browser   # opens OAuth in browser (recommended)
stophy login --api-key   # paste API key manually
export STOPHY_API_KEY="st_..."  # or set env var
```

## License

MIT
