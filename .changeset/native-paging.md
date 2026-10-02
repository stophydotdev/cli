---
"@stophy/cli": patch
---

`--limit` is gone. Each command returns one page from the site: use `--page` where a command takes a page number, or `--cursor` with the cursor from the last result. New commands such as `google` and `ai` now show up right away, and an endpoint list the CLI cannot fully read no longer stops every command.
