---
id: kotlin-05
title: "Coroutines: Structured Concurrency Fundamentals"
minutes: 16
level: senior
---

"Coroutines are like async/await" is close enough to get started and
wrong enough to cause real production bugs. The Flutter course's async
chapter covered the widget-lifetime side of this problem; this chapter
covers the deeper mechanism Kotlin coroutines are actually built on —
**structured concurrency** — which is a genuinely different guarantee
than async/await alone provides in most other languages.

## suspend functions: pausable, not asynchronous by default

```kotlin
suspend fun fetchUser(id: String): User {
    delay(100)                    // suspends without blocking the thread
    return api.getUser(id)
}
```

`suspend` marks a function as **pausable** — it can suspend execution
(yielding the thread back to do other work) and resume later, without
blocking the underlying thread while waiting. This is not automatically
"runs on a background thread" — a `suspend` function, called plainly,
still runs on whatever thread called it; concurrency (actually running
work elsewhere) is a separate, explicit choice (`Dispatchers`, covered
below), not an automatic property of `suspend` itself.

> **Interview lens:** "Does marking a function `suspend` make it run
> asynchronously?" — the precise answer: no. `suspend` only means the
> function *can* suspend at certain points (any call to another `suspend`
> function); it says nothing about which thread runs it. Conflating
> "suspendable" with "asynchronous" is the single most common coroutines
> misconception.

## Structured concurrency: the actual point

A `CoroutineScope` isn't just a container for launching coroutines — it's
a **lifetime boundary**. Every coroutine launched within a scope is a
child of that scope, and the scope cannot complete until all its children
do; cancelling the scope cancels every child automatically, recursively.

```kotlin
coroutineScope {
    launch { fetchUser(1) }   // child coroutine
    launch { fetchUser(2) }   // child coroutine
}   // this line doesn't complete until BOTH children finish
```

This is the actual, load-bearing guarantee "structured" refers to: **no
coroutine can outlive the scope that launched it**, and **no scope
completes while it still has unfinished children**. Compare this to
launching two raw threads or two unstructured `async` calls in many other
languages — nothing there prevents a "fire and forget" coroutine from
outliving its logical parent, silently leaking work (and, if it captures
resources — a database connection, a file handle — leaking those too)
long after the operation that started it was supposed to be over.

## Cancellation propagates through the structure

```kotlin
val job = scope.launch {
    launch { longRunningTask() }    // child
    launch { anotherTask() }        // child
}
job.cancel()   // cancels the parent AND both children, recursively
```

Because children are tracked within their parent's structure, cancelling
a parent job cancels its entire subtree — this is the direct payoff of
the tree-shaped lifetime relationship, and it's why coroutines can
correctly implement "the user navigated away, stop everything this screen
started" (the Flutter course's async-lifetime problem) with one
`cancel()` call at the scope level, rather than needing to manually track
and cancel every individual operation.

**Cancellation is cooperative, not preemptive** — a coroutine must
actually check for cancellation (which every suspension point does
automatically) to actually stop. A coroutine running a tight,
non-suspending CPU loop with no suspension points **ignores cancellation
entirely** until it either finishes or hits a suspension point — the same
"cooperative, not forced" property every cooperative-scheduling system
has, and a real, common cause of "I called cancel() and it kept running"
bugs.

> **Trade-off:** Cooperative cancellation trades away the ability to
> forcibly interrupt arbitrary code (which would risk leaving shared
> state in a torn, inconsistent condition) for a guarantee that a
> coroutine only stops at a point it has explicitly agreed it's safe to
> stop. The practical consequence: CPU-bound coroutine code should
> periodically call `ensureActive()` or `yield()` to opt into
> cancellation checks if it doesn't naturally suspend often enough.

## `Dispatchers`: where the work actually runs

`suspend` and structure say nothing about *which thread* runs the code —
that's `Dispatchers`' job, and it's an explicit, separate choice:

- **`Dispatchers.Main`**: the UI thread (Android) — required for anything
  touching UI state.
- **`Dispatchers.IO`**: a thread pool tuned for blocking I/O (network,
  disk) — many more threads than CPU cores, since I/O-bound work spends
  most of its time waiting, not computing.
- **`Dispatchers.Default`**: a thread pool sized to CPU core count — for
  genuinely CPU-bound work (parsing, computation), the same "isolate for
  CPU-bound work" distinction the Flutter course drew for Dart's
  `compute()`, expressed here as a dispatcher choice instead of a
  separate isolate.

```kotlin
suspend fun loadAndProcess() = withContext(Dispatchers.IO) {
    val raw = fetchRawData()          // I/O-bound: correct dispatcher
    withContext(Dispatchers.Default) {
        parseExpensively(raw)          // CPU-bound: switch dispatchers for this part
    }
}
```

Using `Dispatchers.IO` for CPU-bound work (or vice versa) doesn't cause a
crash — it causes a real, silent performance problem: blocking I/O calls
on `Default`'s small, CPU-sized pool starves other CPU-bound work of
threads; heavy computation on `IO`'s large pool wastes the pool's design
intent (many threads mostly idle-waiting) without any error signaling
that anything is wrong.

## Key takeaways

- `suspend` means pausable, not automatically asynchronous — it says
  nothing about which thread runs the function; that's `Dispatchers`'
  separate, explicit responsibility.
- Structured concurrency's actual guarantee: no coroutine outlives its
  scope, no scope completes with unfinished children — cancelling a scope
  recursively cancels its entire coroutine subtree, one call handling an
  entire operation's cleanup.
- Cancellation is cooperative: a coroutine only actually stops at a
  suspension point (or an explicit `ensureActive()`/`yield()` check) —
  tight CPU loops with no suspension points ignore `cancel()` until they
  finish or add a check.
- Choosing the right `Dispatchers` (`Main`/`IO`/`Default`) for the work's
  actual nature (UI, blocking I/O, CPU-bound) matters — the wrong choice
  doesn't crash, it silently degrades performance with no error signal.
