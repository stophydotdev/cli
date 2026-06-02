# @stophy/cli

YouTube for AI agents. Search, transcripts, comments, channels, playlists. All output is JSON. Pipe it into jq, scripts, or agents.

## Install

```bash
npm install -g @stophy/cli
```

Node.js 18 or later. Get an API key from [stophy.dev/dashboard](https://stophy.dev/dashboard).

## Auth

```bash
stophy login --browser           # opens browser
stophy login --api-key st_xxx    # paste key directly
export STOPHY_API_KEY="st_..."   # env var also works
```

## Commands

### search

```bash
stophy search --q "typescript tutorial" --type video --sortBy viewCount
stophy search --q "next.js" --uploadDate week --duration long
```

### video details

```bash
stophy video details --url "https://youtube.com/watch?v=QRvfjPltvmE"
```

```json
{
  "id": "QRvfjPltvmE",
  "title": "TraRags Reacts To Kendrick Lamar - GNX",
  "author": "TRA RAGS STREAMS",
  "viewCount": 204828,
  "likeCount": 9170,
  "durationText": "2 hours 42 minutes 27 seconds",
  "publishedAt": "2024-11-23T08:22:36.000Z"
}
```

### video transcript

```bash
stophy video transcript --url "https://youtube.com/watch?v=..."
```

```json
{
  "language": "en",
  "segments": [
    { "text": "what is up everybody", "start": 0.0, "duration": 1.96 },
    { "text": "welcome back to the channel", "start": 1.96, "duration": 2.0 }
  ]
}
```

### video comments

```bash
stophy video comments --url "https://youtube.com/watch?v=QRvfjPltvmE" --sortBy top
```

```json
{
  "items": [
    { "text": "\"Nah, that's not enough\" 😂", "author": "@terribletimes902", "likeCount": 2100 },
    { "text": "53:15 BRO CREAMED HIMSELF LIVE 😭😭😭😭", "author": "@Aunos1", "likeCount": 593 },
    { "text": "WHO ELSE BACK TO THIS AFTER THE ICEMAN REACTION?? 🙌🏾✊🏾", "author": "@colouredhearts", "likeCount": 134 }
  ],
  "continuationToken": "..."
}
```

### channel

```bash
stophy channel --url "https://youtube.com/@t3dotgg" --tab video --sortBy popular
```

```json
{
  "channel": {
    "name": "Theo - t3.gg",
    "handle": "@t3dotgg",
    "subscriberCount": "539K subscribers",
    "videoCount": "1K videos",
    "isVerified": true
  },
  "items": [
    { "title": "PirateSoftware is right, this needs to stop", "viewCount": 1000000, "duration": "15:14" }
  ]
}
```

### playlist

```bash
stophy playlist --url "https://youtube.com/playlist?list=PLxxxx"
```

### usage and logs

```bash
stophy usage --days 7
stophy logs --days 30 --endpoint /v1/video
```

## All commands

| Command | Description |
|---------|-------------|
| `stophy login` | Authenticate with API key or browser |
| `stophy search` | Search YouTube by keyword |
| `stophy suggest` | Search autocomplete suggestions |
| `stophy video details` | Video metadata |
| `stophy video transcript` | Timestamped transcript |
| `stophy video comments` | Paginated comments |
| `stophy video replies` | Comment replies |
| `stophy channel` | Channel videos, shorts, playlists, or about |
| `stophy playlist` | All videos in a playlist |
| `stophy credits` | Remaining credit balance |
| `stophy usage` | API usage for your key |
| `stophy logs` | Request logs for your key |
| `stophy view-config` | Config and auth status |
| `stophy logout` | Clear saved credentials |

Each command supports `--help`. Full docs at [docs.stophy.dev](https://docs.stophy.dev).

## Skills

Five agent skills included. Works with Claude Code, OpenCode, and any agent that supports skills.

```bash
npx skills add stophydotdev/cli
```

| Skill | Description |
|-------|-------------|
| `stophy-cli` | Full CLI reference |
| `stophy-search` | Search YouTube by keyword |
| `stophy-video` | Transcripts, comments, and metadata |
| `stophy-channel` | Browse channel catalogs |
| `stophy-playlist` | Fetch playlist contents |

## License

MIT
