# CodeRecall — Content

Course content for [CodeRecall](https://github.com/rwaqar/coderecall-app): an
offline-first, login-free learning app for senior and staff-level developers.

This repository is the single source of truth for all courses. It feeds:

- **The Android app** — basics courses are bundled into the APK; advanced
  courses are published as versioned content packs on GitHub Releases and
  downloaded once by the app.
- **The website** (GitHub Pages) — built from this same Markdown, so content is
  written once and published everywhere.

## Structure

```
manifest.json            # index of all content packs + versions (read by the app)
docs/
  chapter-format.md      # authoring conventions for chapters
  quiz-schema.md         # JSON schema for quizzes
courses/
  <course-id>/
    course.json          # course metadata + ordered chapter list
    chapters/*.md        # one Markdown file per chapter
    quizzes/*.json       # one quiz file per chapter
```

## Course roadmap

Courses are built strictly one at a time:

| # | Course | Status | Delivery |
|---|--------|--------|----------|
| 1 | Object-Oriented Programming | **In progress** | Bundled |
| 2 | Data Structures | Planned | Bundled |
| 3 | Algorithms | Planned | Bundled |
| 4 | Flutter | Planned | Downloadable pack |
| — | Kotlin · React Native · Swift · .NET Core · Cloud & DevOps · PHP/Laravel · Data Analyst · AI/ML | Backlog (demand-driven) | Downloadable packs |

## Contributing

Issues and PRs for corrections are welcome. New chapters go through editorial
review before merging — quality over volume, always.

## License

Content is licensed under [CC BY-NC-SA 4.0](LICENSE.md).
The app's source code lives in [coderecall-app](https://github.com/rwaqar/coderecall-app) under MIT.
