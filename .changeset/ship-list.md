---
"@stophy/cli": patch
---

Follow the API we ship. Help examples and the README no longer use removed commands, and only `stophy web search` is listed as working without a login. `tiktok profile` and `instagram profile` print their list as results and page with `--limit` and `--cursor`. `--cursor` takes the cursor exactly as the API returned it, so paging with a small `--limit` works.
