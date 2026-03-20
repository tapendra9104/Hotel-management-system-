# Contributing to GrandStay

Thank you for contributing to GrandStay.

## Workflow

1. Fork the repository.
2. Create a new branch for your change.
3. Keep changes focused and easy to review.
4. Run the local verification commands before submitting.
5. Open a pull request with a clear summary of what changed and why.

## Local Checks

```powershell
npm --prefix backend run typecheck
node tools/run-final-test.js
```

## Good Contributions

- UI polish and responsive improvements
- new booking, spa, dining, or admin features
- backend route improvements
- bug fixes
- documentation improvements

## Please Avoid

- committing local database files
- committing secrets or `.env` files
- mixing unrelated changes into one pull request

## Questions

If you are unsure about a change, open an issue or describe the intent clearly in your pull request.
