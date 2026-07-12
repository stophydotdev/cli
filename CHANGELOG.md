# @stophy/cli

## 1.2.0

### Minor Changes

- 433be01: Add YouTube Music and YouTube Kids commands, switch suggestions to the POST API, and align CLI request/response types with the current Stophy endpoints.

## 1.1.0

### Minor Changes

- a0011a9: Add `stophy init --all --browser` for one-command CLI installation, global agent skill setup, and browser authentication.

### Patch Changes

- 35b9339: Ensure the curl installer updates the currently resolved Stophy executable when possible, with a PATH-safe fallback for installations that are not writable.

## 1.0.9

### Patch Changes

- 7daf26b: Publish the CLI through the new Changesets and trusted publishing workflow, keeping the documented installer routes aligned with the hosted `stophy.dev` install commands.
