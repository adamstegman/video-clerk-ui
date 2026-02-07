---
module: System
date: 2026-02-06
problem_type: workflow_issue
component: development_workflow
symptoms:
  - "Changes made on a PR branch not committed and pushed"
  - "Open GitHub PR does not reflect latest local work"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: medium
tags: [git, github, pull-request, commit, push, workflow]
---

# Troubleshooting: Always Commit and Push When Working on an Open PR Branch

## Problem
When working on a branch that has an open GitHub pull request, completed changes should always be committed and pushed so the PR stays current. Forgetting to push means reviewers see stale code and CI doesn't run against the latest changes.

## Environment
- Module: System-wide
- Affected Component: Development workflow / Git operations
- Date: 2026-02-06

## Symptoms
- Changes made on a PR branch are not committed and pushed after completion
- Open GitHub PR does not reflect the latest local work
- Reviewers see outdated code in the PR
- CI/CD pipelines run against stale commits

## What Didn't Work

**Direct solution:** The problem was identified and fixed on the first attempt.

## Solution

When working on a branch that tracks an open GitHub PR, always commit and push completed work as a final step. The workflow should be:

1. Make changes
2. Verify changes work (typecheck, tests)
3. Commit with a descriptive message
4. Push to the remote branch

**Commands run:**
```bash
# After completing work on a PR branch:
git add <changed-files>
git commit -m "descriptive commit message"
git push
```

**How to check if the current branch has an open PR:**
```bash
# Check if branch tracks a remote and has an open PR
gh pr status
# or
gh pr view --web  # opens the PR in browser
```

## Why This Works

When a branch has an open PR on GitHub, any commits pushed to that branch automatically appear in the PR. This ensures:
1. Reviewers always see the latest code
2. CI/CD pipelines run against the most recent changes
3. The PR diff accurately reflects the current state of work
4. No work is lost if something happens to the local machine

## Prevention

- After completing any unit of work on a PR branch, always commit and push
- Before ending a session, run `git status` to check for uncommitted changes
- Use `gh pr status` to check if the current branch has an open PR
- Make pushing a habit as part of the "done" checklist for any task

## Related Issues

No related issues documented yet.
