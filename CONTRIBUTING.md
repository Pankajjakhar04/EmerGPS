# Contributing

## Branch Strategy

- `main` is protected and release-ready.
- Never commit directly to `main`.
- Create feature branches from `main` using this pattern:
  - `feature/<short-description>`
  - `fix/<short-description>`
  - `chore/<short-description>`

## PR-Based Flow

1. Sync local `main`:
   - `git checkout main`
   - `git pull origin main`
2. Create a branch:
   - `git checkout -b feature/<name>`
3. Make changes and commit:
   - `git add .`
   - `git commit -m "feat: <message>"`
4. Push your branch:
   - `git push -u origin feature/<name>`
5. Open a Pull Request into `main`.
6. Wait for checks to pass and request at least one review.
7. Merge PR with "Squash and merge".

## Required Checks Before Merge

- `npm run lint`
- `npm test`

## GitHub Branch Protection (main)

In GitHub repo settings, enable these for `main`:

- Require a pull request before merging
- Require approvals: at least 1
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Do not allow bypassing the above settings
- Restrict who can push to matching branches (optional but recommended)

## No Force Push Rule

- Force pushes to `main` are not allowed.
- If history repair is needed, use a new branch and PR.
