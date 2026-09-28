# Changesets

Add a changeset for user-facing changes:

```bash
bun run changeset
```

When changesets land on `main`, GitHub opens a Version Packages pull request. Merging it only updates `package.json` and `CHANGELOG.md`. **Merging never publishes.** Release by hand: `gh workflow run publish.yml -R stophydotdev/cli` (npm), then `gh workflow run release-binaries.yml -R stophydotdev/cli` (binaries and Linux packages).

## Versions

The catalog release is **2.0.0**. All changesets after 2.0.0 are `patch`, never `minor` or `major`, unless Hussein says otherwise.
