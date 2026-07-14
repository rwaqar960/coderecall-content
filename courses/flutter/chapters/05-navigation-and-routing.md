---
id: flutter-05
title: Navigation and Routing
minutes: 14
level: senior
---

`Navigator.push` and `Navigator.pop` feel like the whole story for the
first several screens of any app — until deep linking, web URLs, or
state-restoration requirements arrive, and the imperative push/pop model
turns out to have no good answer for "what page are we on, expressed as
data." This chapter is about that gap, and when it actually matters.

## Imperative navigation: a stack, pushed and popped

The original Flutter navigation model treats screens as a literal stack:

```dart
Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(id: 42)));
Navigator.pop(context);
```

This is simple, direct, and completely adequate for a large fraction of
real apps: anything where navigation is genuinely a sequence of user
actions (tap a list item, see detail, go back) with no requirement to
represent "current screen" as external, inspectable state. The model's
limitation isn't that it's wrong — it's that **the stack only exists at
runtime, inside the Navigator's memory**. There's no data structure
anywhere describing "the user is on the detail screen for item 42" that
exists independent of having actually pushed it.

## Where imperative navigation runs out: three concrete requirements

- **Deep linking** — opening the app directly to `/products/42` (from a
  notification, a shared link, a web URL) requires reconstructing the
  *entire stack* that would have led there, not just pushing one screen —
  otherwise pressing back from the deep-linked screen has nowhere sensible
  to go.
- **Web URLs** — a web app needs the browser's address bar to reflect
  current navigation state, and needs browser back/forward to drive the
  app's navigation — a two-way sync the imperative model has no hook for.
- **State restoration** — Android can kill and restore an app's process;
  restoring "what screen was the user on" requires that screen to be
  expressed as serializable data, not "whatever happened to be on the
  stack when the process died."

All three requirements share a shape: **navigation state needs to be data
you can read, construct, and serialize** — not just a sequence of
imperative calls that happened to run.

> **Interview lens:** "Why would you use the Router API instead of
> Navigator.push?" — the weak answer is "it's more modern." The strong
> answer names the actual requirement: deep linking, web URL sync, or
> state restoration all need navigation state to exist as inspectable
> data, which imperative push/pop structurally cannot provide.

## Declarative routing: navigation state as data

The Router API (what packages like `go_router` are built on) inverts the
model: instead of imperatively pushing routes, you declare **what the
page stack should look like as a function of current state**, and the
framework reconciles the actual Navigator to match — the same
declarative-diffing idea as widgets generally (chapter 1), applied to the
stack of pages instead of a widget subtree.

```dart
// Conceptually: the page stack is derived from state, not built by push() calls
List<Page> _buildPages(AppState state) {
  return [
    const MaterialPage(child: HomeScreen()),
    if (state.selectedProductId != null)
      MaterialPage(child: DetailScreen(id: state.selectedProductId!)),
  ];
}
```

Now "the user is on the detail screen for product 42" is a fact
recoverable from `state.selectedProductId`, independent of navigation
history — which is exactly what deep linking, URL sync, and state
restoration all need. `go_router` (the most common practical choice) adds
URL-pattern-based route definitions on top of this, so most teams never
hand-roll the `Router` API directly — but understanding what it's solving
is what makes `go_router`'s API make sense rather than feeling like
arbitrary ceremony.

> **Trade-off:** Declarative routing's cost is real: more upfront
> structure, a route configuration to maintain, and a genuinely different
> mental model from "just push a screen" for a team new to it. For an app
> with no deep-linking, no web target, and no state-restoration
> requirement, imperative `Navigator.push`/`pop` is not a compromise — it's
> the correctly-scoped tool, same "don't pay for what you don't need"
> discipline as everywhere else in this course.

## Nested navigation: more than one stack

A common real requirement — a bottom navigation bar where each tab keeps
its own independent back-stack (switching tabs and switching back should
preserve each tab's navigation position) — needs **nested Navigators**,
one per tab, each maintaining its own stack independently of the others.
The parent (holding the bottom nav bar) never changes; each tab's own
Navigator handles its own push/pop, invisible to its siblings.

```dart
IndexedStack(
  index: currentTab,
  children: [
    Navigator(key: homeNavKey, onGenerateRoute: ...),     // tab 1's own stack
    Navigator(key: searchNavKey, onGenerateRoute: ...),   // tab 2's own stack
  ],
)
```

`IndexedStack` (not a conditional `if`) is the specific reason this works
smoothly: it keeps every tab's widget subtree alive, just not visible —
switching tabs doesn't rebuild-from-scratch the way conditionally
including/excluding a widget would (chapter 1's type-change-destroys-
state lesson, applied here deliberately in reverse: `IndexedStack` avoids
the type/position change that would otherwise reset each tab's Navigator
state on every switch).

## Key takeaways

- Imperative `Navigator.push`/`pop` treats the screen stack as runtime-
  only memory — completely adequate when navigation state never needs to
  be read, constructed, or serialized as data.
- Deep linking, web URL sync, and state restoration all share one
  requirement: navigation state must exist as inspectable, reconstructible
  data — which is what declarative routing (the Router API, `go_router`)
  provides and imperative push/pop structurally cannot.
- Declarative routing has a real cost (more structure, a different mental
  model) — for apps without deep-linking/web/restoration requirements,
  imperative navigation is the correctly-scoped choice, not a compromise.
- Nested Navigators (one per tab) give each tab an independent back-stack;
  `IndexedStack` (not conditional inclusion) is what keeps each tab's
  Navigator state alive across switches, directly applying chapter 1's
  widget-identity lesson.
