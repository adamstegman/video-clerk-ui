---
module: System
date: 2026-02-10
problem_type: workflow_issue
component: development_workflow
symptoms:
  - "docs/architecture.md out of date after refactoring"
  - "CLAUDE.md references stale file paths or patterns"
  - "README.md describes features or structure that no longer exist"
  - "Documentation drift after multiple commits on a PR"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: medium
tags: [docs, documentation, workflow, commit, pull-request, architecture]
---

# Troubleshooting: Keep PR-Touched Docs Updated on Every Commit

## Problem
When a PR modifies documentation files (e.g., `docs/architecture.md`, `CLAUDE.md`, `README.md`), subsequent code changes on the same branch can silently invalidate those docs. By the time the PR is reviewed, the documentation no longer matches the code.

This happened during the `migrate-to-expo` PR (#27): `docs/architecture.md` was updated early in the branch, but after dozens of refactoring commits (decomposing settings, list, login, invite, and landing pages), the doc had ~14 inaccuracies — wrong auth method, stale file paths, outdated code examples, removed routes still listed, and incorrect state management descriptions.

## Environment
- Module: System-wide
- Affected Component: Development workflow / Documentation
- Date: 2026-02-10

## Symptoms
- Architecture docs reference files that were moved or deleted
- Code examples in docs use patterns that were refactored away
- Route structures described in docs don't match `app/` directory
- Import paths in docs point to old locations
- Reviewers find docs and code tell different stories

## Solution

Before every commit on a PR branch, check which docs the PR has touched and verify they still reflect the current code:

```bash
# List docs changed in this PR
git diff main...HEAD --name-only -- 'docs/' '*.md'
```

For each changed doc, ask:
1. Do file paths referenced in the doc still exist?
2. Do code examples match current implementations?
3. Do architectural descriptions reflect recent refactors?
4. Are removed features/routes/files still mentioned?

If any doc is stale, update it in the same commit as the code change that invalidated it.

## Why This Works

Documentation that ships with code changes should describe the code *as it exists at that commit*. Updating docs alongside the code change that breaks them:
1. Keeps the PR internally consistent at every commit
2. Prevents accumulation of doc debt across a long-lived branch
3. Makes review easier — reviewers don't have to cross-reference stale docs
4. Avoids a separate "fix docs" commit at the end that's easy to forget

## Prevention

- After any structural change (file moves, renames, route changes, pattern refactors), immediately check if PR-touched docs reference the affected paths or patterns
- Treat docs like tests: if you change the code they describe, update them in the same commit
- For large refactoring PRs, periodically re-read the full doc to catch accumulated drift

## Related Issues

- [commit-push-on-open-pr](./commit-push-on-open-pr-System-20260206.md) — complementary workflow step: push after committing
