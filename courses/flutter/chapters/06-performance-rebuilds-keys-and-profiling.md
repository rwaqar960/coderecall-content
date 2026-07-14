---
id: flutter-06
title: "Performance: Rebuilds, Keys, and Profiling"
minutes: 15
level: senior
---

"My app feels janky" is a symptom with a dozen possible causes, and the
biggest mistake in diagnosing it is guessing based on intuition about
what *should* be slow rather than measuring what *is* slow. This chapter
covers the two or three mechanisms actually responsible for most Flutter
performance problems, and the tool that tells you which one you actually
have.

## const constructors: the cheapest optimization that exists

Chapter 1 established rebuilds are cheap because widgets are cheap to
create. A `const` widget constructor is cheaper still: Dart's compiler
recognizes `const` widgets as **identical instances**, canonicalized at
compile time, so the framework can skip the diff entirely — not "diff
quickly," but genuinely not re-examine it at all, because it's provably
the exact same object as last time.

```dart
// Rebuilt (allocated, diffed) on every parent rebuild
Text('Loading...', style: TextStyle(color: Colors.grey))

// Same object every time — provably unchanged, skipped entirely
const Text('Loading...', style: TextStyle(color: Colors.grey))
```

This only works for widgets with no runtime-dependent values in their
constructor arguments — anything built from a variable can't be `const`.
The practical habit: add `const` everywhere the Dart analyzer allows it
(a lint, `prefer_const_constructors`, catches most missed cases
automatically) — it's close to a free performance win with no downside,
which is why it's worth defaulting to rather than reasoning about
case-by-case.

## The real cost of a wide rebuild: unnecessary work, not incorrect output

A `setState` call that rebuilds a large subtree unnecessarily doesn't
produce wrong output — chapter 1's diffing still catches unchanged
RenderObjects and skips their layout/paint. The cost is **wasted CPU time
on the diff itself**: walking a large widget subtree to confirm nothing
changed is real work, even when the conclusion is "nothing to do." At
small scale this is invisible; at the scale of a complex screen rebuilding
on every animation frame, it's the most common source of dropped frames.

The fix is **scoping rebuilds narrowly** — extracting the part that
actually changes into its own small widget, so `setState` (or a state
management library's rebuild trigger) only walks that small subtree, not
its unrelated siblings:

```dart
// Rebuilds the ENTIRE column, including the expensive header, on every tick
Column(children: [ExpensiveHeader(), Text('$_seconds s')])

// Only the extracted widget rebuilds; ExpensiveHeader is untouched
Column(children: [const ExpensiveHeader(), _TimerText(seconds: _seconds)])
```

This is the same principle as chapter 2's setState scoping, applied as a
deliberate performance technique rather than an incidental property:
smaller, more granular widgets aren't just "good practice" abstractly,
they directly bound the size of every future diff.

## ListView.builder: not building what isn't visible

A `ListView` given a full, pre-built list of children constructs **every
item immediately**, whether it's on screen or not. `ListView.builder`
constructs items **lazily**, only as they scroll into view (plus a small
buffer) — for a list of 10,000 items, this is the difference between
building 10,000 widgets upfront and building roughly however many fit on
screen.

```dart
// Builds all 10,000 items immediately, most of which are never seen
ListView(children: items.map((i) => ItemTile(i)).toList())

// Builds items lazily, as they scroll near the visible viewport
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemTile(items[index]),
)
```

This is a specific, common performance mistake precisely because the
`ListView` version *works correctly* and even performs fine for short
lists — it only becomes a visible problem at a list length most
developers don't test against locally, the same "looks fine in the demo,
breaks at real scale" pattern that shows up throughout this course.

## Profiling instead of guessing

Flutter DevTools' **Performance** view shows an actual frame-by-frame
timeline — which frames exceeded the 16ms budget (for 60fps), and what
was happening during them (build, layout, paint, or raster time). The
**Widget Rebuild Stats** / rebuild-tracking tools show *which widgets*
rebuilt and *how often*, directly answering "is my scoping actually
working" instead of guessing from reading code.

> **Interview lens:** "How would you diagnose a janky screen?" — the weak
> answer jumps straight to "add `const` everywhere" or "use
> `ListView.builder`." The strong answer starts with **profiling first**
> — open DevTools, find which frames are slow and why, *then* apply the
> specific fix the data points to. Guessing which of several plausible
> causes is the real one wastes time on interventions that don't move the
> actual bottleneck.

> **Trade-off:** Aggressively splitting every widget into the smallest
> possible pieces "for performance" has a real readability and
> indirection cost — the same over-abstraction risk the OOP and
> algorithms courses warn about generally. Profile first, then scope the
> specific subtree DevTools identifies as expensive — not every widget in
> the app preemptively.

## Key takeaways

- `const` constructors let the framework skip the diff entirely for
  provably-unchanged widgets — close to a free win, worth defaulting to
  wherever the analyzer allows it.
- A wide, unnecessary rebuild doesn't produce wrong output (the diff still
  catches unchanged RenderObjects) — its cost is wasted CPU walking a
  large subtree just to confirm nothing changed.
- Scoping rebuilds to small, extracted widgets directly bounds diff size
  — the same setState-scoping principle from chapter 2, applied
  deliberately for performance.
- `ListView.builder` builds items lazily as they scroll into view;
  `ListView` with a pre-built list builds everything immediately —
  invisible at small scale, a real problem at list lengths many
  developers don't test locally.
- Profile with DevTools' Performance and rebuild-tracking views *before*
  applying fixes — guessing which of several plausible causes is real
  wastes effort on the wrong intervention.
