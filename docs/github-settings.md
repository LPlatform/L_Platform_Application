# GitHub settings and outstanding setup

Squash-only merge, read-only Actions defaults, and `main` branch protection are active. `main` requires a PR, conversation resolution, linear history and required status checks, with zero required approvals; force pushes and branch deletion are blocked. The required contexts have been corrected to actual job/matrix check names; the updated PR head must produce fresh runs before mergeability is confirmed. An active tag ruleset for `app-v*` blocks tag update and deletion.

Dependency alerts/security updates, secret scanning and push protection are enabled. CodeQL and dependency review are visibly skipped until application source and lockfiles exist. No staging or production Environments exist yet. The owner must create protected production/release environments, set reviewers and deployment branch restrictions, and configure signing credentials after signing is selected. Do not add credentials to this public repository.
