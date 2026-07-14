---
id: kotlin-06
title: "Coroutines in Practice: Flow, Channels, and Cancellation Pitfalls"
minutes: 16
level: senior
---

Chapter 5 established coroutines' theory. This chapter is where most real
coroutine bugs actually live: choosing between `Flow` and `Channel` for
streaming data, and the specific, recurring mistakes that break structured
concurrency's guarantees in practice — usually by accident, usually by
reaching for the wrong tool out of habit.

## Cold vs. hot: the distinction that decides everything

**`Flow` is cold** — its code doesn't run until something collects it,
and each collector triggers an independent execution from the start.
**`Channel` is hot** — it exists and can receive/send values regardless
of whether anything is currently listening, and values sent with no
active receiver are simply lost (unless buffered).

```kotlin
val coldFlow = flow {
    println("started")   // this line runs once PER collector
    emit(1)
}

coldFlow.collect { }   // prints "started"
coldFlow.collect { }   // prints "started" AGAIN — independent execution
```

This single distinction determines the right tool: a **cold** `Flow` is
correct for "run this query, produce these results" (each collector gets
its own, independent, complete execution — a network request re-fetched
per subscriber is usually what you want). A **hot** `Channel` is correct
for "distribute events to whoever happens to be listening right now" (a
button-click event, a WebSocket message) — values aren't replayed for
late subscribers, and that's precisely the point.

> **Interview lens:** "When would you use a Channel instead of a Flow?"
> — the strong answer names the cold/hot distinction directly: Channel
> for genuinely event-like, hot data where late subscribers should *not*
> replay history; Flow for anything where each consumer should get its
> own complete, independent execution.

## Flow operators run per-collection, not once

Because `Flow` is cold, operators chained onto it (`map`, `filter`,
`onEach`) also re-execute per collection — this is easy to forget when
an operator has a side effect:

```kotlin
val requests = flow { emit(fetchConfig()) }
    .onEach { logCount++ }   // increments once PER collector, not once total

requests.collect { }   // logCount += 1
requests.collect { }   // logCount += 1 again — fetchConfig() ALSO reran
```

If `fetchConfig()` is expensive or has side effects, collecting the same
`Flow` twice runs it twice — not a caching mechanism, by design. Sharing
a single execution across multiple collectors requires deliberately
converting to hot (`shareIn`/`stateIn`), a conversion decision that
should be made explicitly, not assumed.

## The GlobalScope trap

```kotlin
// WRONG: escapes structured concurrency entirely
fun onButtonClick() {
    GlobalScope.launch {
        syncData()   // outlives the screen, the activity, everything
    }
}
```

`GlobalScope` is a coroutine scope with **application lifetime** — a
coroutine launched there is, by definition, not a child of anything
meaningful, so it can never be cancelled by a parent scope's
cancellation. This is structured concurrency's guarantee **deliberately
opted out of**, and it's almost always a mistake: the coroutine keeps
running after the screen that started it is gone, exactly the leaked-work
problem chapter 5 said structured concurrency exists to prevent — via the
one escape hatch that bypasses it entirely.

> **Trade-off:** `GlobalScope` has a vanishingly small legitimate use
> case — work that genuinely should outlive any UI component and run for
> the whole application's lifetime (though even then, a purpose-built,
> explicitly-scoped application-level `CoroutineScope` is almost always
> better, since it can still be cancelled on app shutdown, unlike
> `GlobalScope`). Treat any `GlobalScope.launch` in review as a red flag
> requiring explicit justification, not a normal pattern.

## `SupervisorJob`: when one child's failure shouldn't cancel its siblings

By default, structured concurrency propagates failure like cancellation:
one child throwing an unhandled exception cancels the whole parent scope
and every sibling. `SupervisorJob` changes this specific behavior —
children fail independently, without taking down their siblings:

```kotlin
val scope = CoroutineScope(SupervisorJob())
scope.launch { riskyOperationA() }   // if this throws...
scope.launch { riskyOperationB() }   // ...this keeps running regardless
```

This is a genuine, deliberate trade-off, not a strictly "safer" default:
regular structured concurrency's fail-together behavior is *correct* when
children are genuinely part of one logical operation (if fetching the
user fails, don't bother rendering their orders); `SupervisorJob` is
correct when children are independent operations that happen to share a
scope (a dashboard with five independent widgets, where one failing
shouldn't blank the other four).

## Key takeaways

- `Flow` is cold (each collector triggers an independent execution from
  scratch); `Channel` is hot (values exist regardless of listeners, lost
  if nothing's receiving) — this single distinction decides which tool
  fits "re-run per subscriber" versus "broadcast to whoever's listening."
- Flow operators with side effects re-execute per collection, because the
  whole flow re-executes per collection — not a caching mechanism;
  sharing one execution requires deliberately converting to hot
  (`shareIn`/`stateIn`).
- `GlobalScope` opts out of structured concurrency entirely — a coroutine
  launched there can outlive its logical owner indefinitely, reproducing
  exactly the leaked-work problem structured concurrency exists to
  prevent. Treat it as a red flag in review, not a normal pattern.
- `SupervisorJob` changes failure propagation so siblings survive one
  child's failure — correct for independent children sharing a scope,
  wrong for children that are genuinely one logical operation that should
  fail together.
