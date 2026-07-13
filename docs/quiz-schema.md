# Quiz JSON schema (v1)

Every chapter has exactly one quiz file in `courses/<course-id>/quizzes/`,
named identically to its chapter (`01-encapsulation-and-invariants.json`).

## File shape

```json
{
  "schemaVersion": 1,
  "chapterId": "oop-01",
  "passScore": 0.7,
  "questions": [ ... ]
}
```

## Question object

```json
{
  "id": "oop-01-q01",
  "type": "mcq",
  "difficulty": "senior",
  "prompt": "Markdown-formatted question text.",
  "code": "class Foo { ... }",
  "codeLanguage": "java",
  "options": [
    { "id": "a", "text": "Markdown-formatted option" },
    { "id": "b", "text": "..." }
  ],
  "answer": ["b"],
  "explanation": "Markdown. Explains why the answer is right AND why each distractor is wrong.",
  "tags": ["encapsulation", "invariants"]
}
```

### Fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `<chapterId>-qNN`, stable forever (spaced repetition keys on it) |
| `type` | yes | `mcq` (single answer) · `multi` (select all that apply) · `code-review` (find the flaw in `code`) |
| `difficulty` | yes | `core` · `senior` · `staff` |
| `prompt` | yes | Markdown |
| `code` | no | Code shown between prompt and options; required for `code-review` |
| `codeLanguage` | with `code` | Highlighting hint |
| `options` | yes | 3–5 options; option `id`s are `a`–`e` |
| `answer` | yes | Array of option ids — length 1 for `mcq`/`code-review`, 1+ for `multi` |
| `explanation` | yes | The most important field. Distractors must be *plausible to a mid-level dev* and the explanation must dismantle each one |
| `tags` | yes | Lowercase kebab-case topic tags; drive spaced-repetition grouping |

## Quality bar

- 5–8 questions per chapter.
- At least one `code-review` question per chapter — senior skill is judgment,
  not recall.
- No trick questions that hinge on syntax trivia; every question should test
  a decision a working engineer actually makes.
- `explanation` is written as if answering "but why?" from a smart skeptic.
