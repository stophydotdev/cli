# Changesets

Add a changeset for user-facing changes:

```bash
bun run changeset
```

When changesets land on `main`, GitHub opens a Version Packages pull request. Merging that pull request updates `package.json` and `CHANGELOG.md`, then the existing publish workflow publishes to npm through trusted publishing.
