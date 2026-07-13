# Chapter authoring format

Every chapter is one Markdown file in `courses/<course-id>/chapters/`,
named `NN-kebab-case-title.md` (e.g. `01-encapsulation-and-invariants.md`).

## Front matter

Each chapter starts with YAML front matter:

```yaml
---
id: oop-01                # <course-id>-<NN>, stable forever
title: Encapsulation and Invariants
minutes: 15               # honest reading estimate
level: senior             # core | senior | staff
---
```

## Structure conventions

- `#` is reserved for the chapter title (rendered from front matter — do not
  repeat it in the body). Body headings start at `##`.
- Open with **why this matters at senior level** in 2–3 sentences — no
  textbook throat-clearing.
- Code blocks always declare a language (```java, ```dart, ```python …).
  Prefer one primary language per chapter, chosen per course.
- Use `> **Interview lens:**` blockquotes to flag how a topic shows up in
  senior/staff interviews.
- Use `> **Trade-off:**` blockquotes for design trade-offs — these are the
  heart of senior-level content.
- End every chapter with `## Key takeaways` — 3–5 bullets, each a claim the
  reader should be able to defend out loud.
- No images unless essential (offline size budget); prefer ASCII/Unicode
  diagrams in code fences.

## Tone

Written for someone who already codes for a living. Skip definitions they
know; challenge assumptions they stopped questioning. Every section should
survive the test: "would a staff engineer learn or sharpen something here?"

## Editorial workflow

1. Draft (AI-assisted) → 2. Owner review (technical accuracy, tone, level)
→ 3. Merge → 4. Included in next pack release.
