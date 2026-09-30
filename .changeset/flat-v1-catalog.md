---
"@stophy/cli": patch
---

The CLI follows the new flat Stophy API. Lists print one row per result with its title and link, other results print as `name: value` lines, and `--json` prints the raw data. Single-word commands such as `stophy transcript <link>` and `stophy suggest`, and choices such as `--network`, `--source` and `--by`, work from the catalog. Markdown output and the removed options are gone.
