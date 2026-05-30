# stophy

CLI for the [Stophy](https://stophy.dev) YouTube data API. Search videos, get transcripts, read comments, browse channels, and fetch playlists. All output is JSON.

## Install

```bash
npm install -g stophy-cli
```

Requires Node.js 18 or later. Get an API key from [stophy.dev/dashboard](https://stophy.dev).

## Auth

```bash
stophy login --browser           # opens OAuth in browser (recommended)
stophy login --api-key st_xxx    # paste API key directly
export STOPHY_API_KEY="st_..."   # or set env var
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
| `stophy login` | Log in to your Stophy account |
| `stophy search` | Search YouTube videos, channels, and playlists |
| `stophy suggest` | Get YouTube search autocomplete suggestions |
| `stophy video details` | Get video metadata |
| `stophy video transcript` | Get timestamped transcript |
| `stophy video comments` | Get paginated comments |
| `stophy video replies` | Get comment replies |
| `stophy channel` | Browse a channel's videos, shorts, playlists, or about page |
| `stophy playlist` | Get all videos in a playlist with full metadata |
| `stophy credits` | Show your remaining credit balance |
| `stophy usage` | Show API usage for your key |
| `stophy logs` | Show request logs for your key |
| `stophy view-config` | Show your current config and auth status |
| `stophy logout` | Clear saved credentials |

Each command supports `--help` for full options. See [docs.stophy.dev](https://docs.stophy.dev) for response shapes.

## License

MIT
