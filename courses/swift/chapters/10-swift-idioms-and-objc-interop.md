---
id: swift-10
title: Swift Idioms, Anti-Patterns, and Objective-C Interop
minutes: 16
level: staff
---

This capstone pulls the course together the way the interop-and-idioms
chapters do for the other language tracks (see the Kotlin course
chapter 10): the difference between Swift written idiomatically and Swift
written as translated Objective-C or Java, plus the interop boundary where
the two worlds meet and the guarantees get fuzzy.

## Idioms that signal fluency

**Prefer `struct` and let the compiler do the work.** Value types by
default, `let` over `var`, small focused types — this isn't stylistic
preference, it's what makes the memory model (chapter 7) and concurrency
model (chapter 9) tractable. Reaching for a `class` should be a decision
with a reason (identity, inheritance, interop), not the default.

**Use the type system instead of runtime checks.** Enums with associated
values model states precisely; optionals model absence; `throws` models
failure. Code that leans on stringly-typed dictionaries, `Any`, or downcasts
is usually re-implementing something the type system would have checked.

**Extensions to organize, protocols to abstract.** Grouping a type's
conformances into focused extensions keeps files navigable; extracting a
protocol at a *real* variation point keeps things testable. Both are cheap;
the anti-pattern is protocols with a single conformer and no test seam
(chapter 3).

**map / compactMap / filter over manual loops** where they read more
clearly — but not dogmatically. A `reduce` that's less legible than the loop
it replaced is a step backward; fluency includes knowing when the
imperative version is clearer.

## Anti-patterns that read as "not really Swift"

- **Force-unwrap as a default** (`!` everywhere) — the recurring theme:
  silencing the compiler instead of modeling the possibility. Each `!`
  should be a deliberate, defensible invariant, not a reflex.
- **Massive View Controller** — cramming networking, state, and layout into
  one class. The fix is extracting value-type models and separating
  concerns, not a bigger class.
- **Reference types for pure data** — a `class` holding only immutable data
  fields is a `struct` that gave up value semantics for nothing.
- **Fighting ARC with manual nil-ing** — setting properties to nil to "help
  the memory get freed" usually signals a retain cycle you should fix
  properly (chapter 7), not a place that needs manual cleanup.

## The Objective-C interop boundary

Swift and Objective-C interoperate deeply — you can call each from the
other — but the boundary is where Swift's guarantees stop, exactly as
Kotlin's null safety stops at the Java boundary.

**Nullability.** Objective-C historically couldn't express whether a pointer
could be nil. Modern headers annotate this (`nullable` / `nonnull`), and
Swift reads those annotations to present proper optionals. Where an old,
*unannotated* API is imported, Swift has to guess — and it imports the value
as an implicitly-unwrapped optional (chapter 1), a value that *looks*
non-optional but crashes if it's actually nil. That's the null-safety hole
at the boundary: the compiler can't verify what the header never stated.

**Bridging.** Foundation types bridge to Swift value types (the Objective-C
string type to Swift's `String`, arrays to `Array`), often with a copy. This
is convenient but not free — bridging a huge collection back and forth in a
hot loop is a real cost a profiler will surface.

**`@objc` and dynamic dispatch.** Exposing Swift to Objective-C (or using
`#selector`, KVO, older UIKit patterns) requires `@objc`, which forces
Objective-C's *dynamic* message dispatch — giving up the static dispatch and
inlining Swift normally uses. It's necessary for those interop features, but
it's a performance and optimizer boundary worth being conscious of, not
sprinkling on for its own sake.

> **Interview lens:** "What happens to null safety when you call an old
> Objective-C API from Swift?" The precise answer: unannotated APIs import
> as implicitly-unwrapped optionals, so a nil that the header never warned
> about produces a crash at the use site — the guarantee is Swift-to-Swift
> and necessarily stops where a language that can't express nullability
> begins. This mirrors the Kotlin/Java platform-types story exactly, and
> naming that parallel is a strong signal.

## Bringing the course together

The through-line of senior Swift is *letting the type system carry the
weight*: optionals for absence, value types for isolation, protocols for
variation, `throws` for failure, actors for shared mutable state — each one
turning a class of runtime bug into something the compiler catches. The
anti-patterns are, almost without exception, ways of opting *out* of that
checking — force-unwraps, `Any`, unannotated interop, reference types for
data. Fluency is knowing where opting out is genuinely justified, and
paying that cost deliberately rather than by habit.

> **Trade-off:** Idiom for its own sake is its own anti-pattern — the
> cleverest `reduce`, the most protocol-oriented design, the most granular
> value types can each be *less* clear than a plain implementation. The
> staff-level skill is optimizing for the reader who maintains this in a
> year, which sometimes means the boring, obvious version wins.
