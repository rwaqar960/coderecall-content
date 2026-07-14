---
id: flutter-04
title: "Async in Flutter: Futures, Streams, and the Widget Tree"
minutes: 16
level: senior
---

Async code and the widget tree have different lifetimes, and almost every
Flutter-specific async bug — the stale-context crash, the leaked
subscription, the flickering loading spinner — comes from forgetting that
fact at exactly the wrong moment. This chapter is about the seam between
the two, not about `Future` and `Stream` mechanics generally.

## The core hazard: the widget might not be there when you return

Any `await` is a suspension point — execution returns to the event loop,
and by the time it resumes, **the widget that started the operation might
have been removed from the tree entirely** (the user navigated away, a
parent rebuilt with a different child, the whole screen was popped).

```dart
Future<void> _submit() async {
  final result = await api.submitOrder(order);   // suspension point
  setState(() => _confirmation = result);          // may run after disposal
}
```

If the widget is gone by the time `setState` runs, this throws — calling
`setState` on an unmounted `State` is a hard error, not a silent no-op,
specifically because it usually indicates exactly this bug. The fix is a
`mounted` check immediately after every `await` that's followed by any
use of `context` or `setState`:

```dart
Future<void> _submit() async {
  final result = await api.submitOrder(order);
  if (!mounted) return;               // widget may be gone — bail out
  setState(() => _confirmation = result);
}
```

This isn't defensive boilerplate for its own sake — it's the direct,
correct consequence of chapter 1's point that `BuildContext` **is** the
Element, and an Element can stop existing while an `await` is suspended.

## FutureBuilder: correct, but easy to misuse

A widget that wraps a `Future` and rebuilds as it resolves seems like the
obvious tool — and it is, with one sharp edge: **the `Future` must be
created once and stored**, never inline in `build()`.

```dart
// WRONG: build() runs on every rebuild, creating a NEW future each time —
// the widget never stops showing "loading," because it never gets to
// observe any single future actually completing before the next rebuild
// replaces it with a fresh, not-yet-resolved one.
FutureBuilder(future: api.fetchUser(), builder: ...)

// RIGHT: the future is created once, in initState, and reused across rebuilds
class _ProfileState extends State<Profile> {
  late final Future<User> _userFuture = api.fetchUser();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(future: _userFuture, builder: ...);
  }
}
```

This bug is extremely common in code review because the inline version
*looks* correct and even works during a quick manual test (the first
build's future does eventually resolve and render) — it only visibly
breaks once something *else* triggers a rebuild before that future
resolves (a parent widget's `setState`, a theme change), restarting the
loading state from the user's perspective for no visible reason.

> **Interview lens:** "What's wrong with passing `future: someAsyncCall()`
> directly to a widget's builder?" is testing whether you understand that
> `build()` runs repeatedly and unpredictably — anything created inline
> there is recreated every time, which is fine for cheap widget objects
> (chapter 1) and actively wrong for a `Future` that represents one
> specific, already-started operation.

## StreamBuilder and subscription lifetime

The same store-it-once discipline applies to `Stream`, with a second
concern layered on top: **who owns the subscription's lifetime**, and does
it get cleaned up. `StreamBuilder` handles this correctly *if given a
stable stream reference* — it manages subscribing and unsubscribing as the
widget enters and leaves the tree. The bug shows up when a stream is
manually subscribed to (`.listen(...)`) instead of handed to
`StreamBuilder`:

```dart
class _LiveScoreState extends State<LiveScore> {
  StreamSubscription<int>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = scoreStream.listen((score) => setState(() => _score = score));
  }

  @override
  void dispose() {
    _sub?.cancel();   // without this: the callback outlives the widget
    super.dispose();
  }
}
```

Forgetting `cancel()` in `dispose()` is the DSA course's "unsubscribed
listener" memory leak, restated in Flutter terms: the subscription (and
everything it closes over, including `this` `State` object) stays alive
as long as the stream is alive, calling `setState` on a disposed widget
the moment the next event arrives — the exact `mounted`-check failure
mode this chapter opened with, arriving from a different direction.

## Debouncing and cancellation: async that outlives its relevance

A search-as-you-type field firing an API call on every keystroke is a
common real requirement with a real async trap: if request 1 is slow and
request 2 (from a later keystroke) is fast, request 1's result can arrive
*after* request 2's and overwrite the correct, newer result with stale
data.

```dart
int _requestId = 0;

Future<void> _search(String query) async {
  final thisRequest = ++_requestId;
  final results = await api.search(query);
  if (thisRequest != _requestId) return;   // a newer search superseded this one
  if (!mounted) return;
  setState(() => _results = results);
}
```

The `_requestId` guard is the general pattern for "discard this async
result if it's no longer the most recent one" — the same shape as
debouncing (delaying the call itself) but handling the case where the
call already went out and just needs its *result* ignored if superseded.

## Key takeaways

- Every `await` is a suspension point; the widget that started the
  operation may be gone by the time execution resumes — check `mounted`
  before using `context` or calling `setState` after any `await`.
- Never create a `Future` inline inside `build()` when passing it to
  `FutureBuilder` — `build()` runs repeatedly, so an inline future is
  recreated every time, restarting the loading state on any unrelated
  rebuild.
- Manually-subscribed streams need explicit cancellation in `dispose()`;
  forgetting it is the same leaked-listener bug from the DSA course,
  arriving via a Flutter-specific failure mode (`setState` on a disposed
  widget).
- A monotonically increasing request ID (or an explicit cancellation
  token) is the general fix for out-of-order async results overwriting
  newer data with stale data.
- These aren't separate bugs to memorize individually — they're the same
  root cause (async lifetime vs. widget lifetime mismatch) showing up in
  four different, recognizable shapes.
