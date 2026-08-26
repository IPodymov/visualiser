---
name: commit-logical-changes
description: Review a Git worktree and turn authorized changes into coherent, reversible commits. Use when the user asks to commit current work, split mixed changes into logical commits, create safe checkpoints, or prepare local history for selective rollback; do not use merely to inspect or review changes.
---

# Commit Logical Changes

Create a local history in which every commit has one reason to exist and can be reverted without removing unrelated work. Preserve the user's files and existing index state throughout the workflow.

## Safety boundaries

- Create commits only when the user has authorized committing. A request to review, explain, or propose a split authorizes a plan, not `git commit`.
- Do not push, rebase, amend published commits, reset, clean, stash, switch branches, or rewrite history unless the user explicitly asks for that separate action.
- Treat all pre-existing changes as user-owned. Do not edit implementation files merely to make staging easier, and do not discard or hide changes.
- Never use `git add .`, `git add -A`, broad globs, or a workspace-wide commit. Stage explicit paths or selected hunks.
- Do not bypass hooks with `--no-verify`. If a hook changes files or fails, inspect the result and report it before continuing.
- Do not commit likely secrets, local environment files, credentials, generated output, large unexpected binaries, or unrelated untracked files. Leave uncertain files untouched and report them.
- Stop if a merge, rebase, cherry-pick, or revert is already in progress, or if HEAD is detached, unless the user explicitly asked to finish that operation.

## Inspect before planning

Read the repository state before touching the index:

```bash
git status --short --branch
git diff --name-status
git diff --stat
git diff --cached --name-status
git diff --cached
git log -8 --pretty=format:'%h %s'
```

Inspect the relevant diffs and untracked files, not just filenames. Note renames, generated files, migrations, tests, documentation, configuration, and dependency files. Infer the repository's commit-message convention from recent history instead of imposing a new one.

If the index already contains changes, preserve it as a candidate first commit when it is coherent. If staged and unstaged changes are mixed or their intent is unclear, do not alter the index; explain the ambiguity and ask before proceeding.

## Design the commit map

Partition the work by intent and dependency, not by file type or directory. A good commit represents one user-visible behavior, bug fix, refactor, infrastructure change, or documentation-only purpose.

- Keep tests, fixtures, documentation, migrations, generated lockfile changes, and configuration with the behavior that requires them.
- Keep producer, consumer, and contract changes together when separating them would leave a broken intermediate revision.
- Separate a pure refactor from a behavior change only when both revisions remain coherent and the split is visible in the actual diff.
- Put prerequisite commits before dependents. Record dependencies so a rollback of a stack can be performed newest-first.
- If one file contains independent purposes, stage hunks selectively. If hunks are inseparable, keep them in one commit rather than manufacturing a misleading split.
- Leave unrelated or unexplained changes uncommitted.

Before mutating the index, present a concise map when there is more than one commit: proposed subject, purpose, included paths or hunks, and dependency on earlier commits. If the user already specified grouping, follow it unless it would make a commit incomplete or unsafe; explain any necessary adjustment.

## Stage and commit one group at a time

For each group:

1. Stage only explicit paths with `git add -- <path>...`. Use interactive hunk staging when only part of a file belongs to the group.
2. Review the exact snapshot with `git diff --cached --stat`, `git diff --cached --name-status`, and `git diff --cached`.
3. Check that the snapshot contains one purpose, includes its required tests or contract changes, and excludes other planned groups.
4. Run `git diff --cached --check` and the smallest relevant validation available. Do not claim that a commit itself passes tests when later unstaged work can affect the working-tree test result.
5. Commit with a short subject matching repository convention. Describe why in the body only when the reason or compatibility impact is not obvious.
6. Inspect `git show --stat --oneline --decorate HEAD` and `git status --short` immediately afterward. Confirm that hooks did not add unintended content before moving to the next group.

If validation fails, the staged diff becomes empty, or the boundary is no longer coherent, stop that group and report the evidence. Do not commit a knowingly broken snapshot unless the user explicitly accepts that tradeoff.

For a history that must be bisectable, verify each newly created commit from a clean temporary worktree at that commit. A test run in the original worktree may include later, unstaged groups and is not proof that the isolated commit works.

## Finish with a rollback-oriented report

After the requested commits are created, inspect the final status and the new log. Report:

- each new hash and subject, in chronological order;
- the purpose of each commit and any dependency between them;
- validations run and their result;
- every file intentionally left uncommitted;
- the safe rollback command, without executing it.

Prefer `git revert <hash>` for an independent committed change. For dependent commits, list their hashes newest-first and recommend reverting in that order. Mention `git reset` only if the user explicitly asks to discard unpublished history and accepts the effect on the working tree.
