# GitHub settings and outstanding setup

Squash-only merging is recommended. After CI runs on a PR, protect `main`: require a PR and observed checks, conversation resolution and linear history; block force pushes and branch deletion. Keep required approval count at zero for solo-owner merging. Require only status names that actually ran. If the current plan blocks rulesets, retain public visibility and upgrade or apply an organization policy.

Enable dependency graph/Dependabot alerts, secret scanning and push protection in Settings → Code security and analysis. GitHub reports security analysis disabled at audit time; support varies by repository plan/settings. Actions defaults should be read-only; release write access is scoped to release jobs. Configure protected signing credentials only when signing is established.
