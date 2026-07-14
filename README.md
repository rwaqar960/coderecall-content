# CodeRecall — Content

Course content for [CodeRecall](https://github.com/rwaqar960/coderecall-app):
an offline-first, login-free learning app for senior and staff-level
developers.

**Read it on the web:** https://rwaqar960.github.io/coderecall-content/

This repository is the single source of truth for all courses. It feeds:

- **The Android app** — basics courses are bundled into the APK; advanced
  courses are published as versioned content packs on GitHub Releases and
  downloaded once by the app.
- **The website** ([site/](site/), deployed to GitHub Pages) — a Docusaurus
  site built from this same Markdown, so content is written once and
  published everywhere. Auto-deploys on every push to `main` via
  [.github/workflows/deploy-site.yml](.github/workflows/deploy-site.yml).

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
site/                    # Docusaurus website (see site/README below)
  scripts/sync-docs.sh   # copies courses/*/chapters into site/docs at build time
```

### Website development

The site has no docs of its own — `site/docs/` is generated from
`courses/*/chapters/` at build time (see `sync-docs.sh`), so it always mirrors
the courses above with zero duplication.

```sh
cd site
npm install
npm start     # syncs docs, then runs the dev server
```

## Course roadmap

Courses are built strictly one at a time:

| # | Course | Status | Delivery |
|---|--------|--------|----------|
| 1 | Object-Oriented Programming | **Complete (v1.0.0)** | Bundled |
| 2 | Data Structures | **Complete (v1.0.0)** | Bundled |
| 3 | Algorithms | **Complete (v1.0.0)** | Bundled |
| 4 | Flutter | **Complete (v1.0.0)** | Downloadable pack |
| 5 | Kotlin | **Complete (v1.0.0)** | Downloadable pack |
| — | React Native · Swift · .NET Core · Cloud & DevOps · PHP/Laravel · Data Analyst · AI/ML | Backlog (demand-driven) | Downloadable packs |

## Contributing

Issues and PRs for corrections are welcome. New chapters go through editorial
review before merging — quality over volume, always.

## License

Content is licensed under [CC BY-NC-SA 4.0](LICENSE.md).
The app's source code lives in [coderecall-app](https://github.com/rwaqar960/coderecall-app) under MIT.
