---
"@stophy/cli": patch
---

`status`, `usage` and `doctor` show your balance in credits even when it is not a whole number of credits. Without an API key and without a terminal, the CLI exits with an error instead of opening a login prompt. `usage` says its totals are for all time, and `logs` says how many days it covers.
