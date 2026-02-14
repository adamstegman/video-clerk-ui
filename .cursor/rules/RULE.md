# Cursor Rules for Video Clerk UI

This project uses `CLAUDE.md` as the canonical AI assistant guide. Read it first — it covers architecture, conventions, and workflows.

## Required: Documented Solutions

At the start of every coding session, read all files in `docs/solutions/` and follow them as mandatory workflow steps. These contain institutional knowledge from past mistakes:

- **`docs/solutions/workflow-issues/`** — Git and development workflow requirements

Key rules from documented solutions:
1. Always commit and push when the current branch has an open GitHub PR
2. Before each commit, check if any docs changed in the PR (`git diff main...HEAD --name-only -- 'docs/' '*.md'`) still match the code

## Quick Reference

- **Framework**: Expo SDK 54 + React Native (universal: web + iOS)
- **Routing**: Expo Router v4 (file-based, routes in `app/`)
- **Styling**: React Native StyleSheet (not Tailwind — this is not a web-only app)
- **Testing**: Jest + @testing-library/react-native
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Pattern**: Container/presenter — containers in `lib/<feature>/`, route wrappers in `app/`
- **Auth**: Email + password (no magic links, no signup currently)

For full details, see `CLAUDE.md`.
