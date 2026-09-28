---
"@stophy/cli": major
---

Replace the fixed YouTube commands with commands generated from the live endpoint catalog. Calls are `stophy <source> <endpoint> [--field value]`, output is markdown by default, and `--json` or `--raw` select JSON. `credits` is removed because `GET /credits` requires a browser session and `stophy login` stores an API key. `usage` and `logs` use the API-key routes.
