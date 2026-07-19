---
id: swift-08
title: Concurrency — async/await and Structured Concurrency
minutes: 17
level: senior
---

Swift's modern concurrency model — `async`/`await`, tasks, and structured
concurrency — replaced a decade of completion handlers and `DispatchQueue`
juggling. It shares deep ideas with Kotlin's coroutines (see
the Kotlin course chapter 5): structured concurrency, cooperative
cancellation, and a compiler that reasons about where you suspend. Getting
the model precise is essential because the failure modes (accidental
serialization, orphaned work, cancellation ignored) are subtle.

## async/await: suspension, not blocking

An `async` function can *suspend* — pause, freeing its thread for other
work, and resume later — at each `await`. This is the crucial distinction
from a blocking call: awaiting does not hold the thread hostage, so a
handful of threads can service thousands of in-flight async operations.

```swift
func fetchUser(id: String) async throws -> User {
    let data = try await network.get("/users/\(id)")   // suspends here, thread freed
    return try decode(data)
}
```

The rewrite from completion handlers isn't only cosmetic. Error handling
returns to ordinary `try` (chapter 6), the "pyramid of doom" of nested
callbacks flattens into straight-line code, and you can't forget to call a
completion handler on one branch — a whole class of bugs disappears.

## await does not mean "run in parallel"

The single most common misread: sequential `await`s run *sequentially*.

```swift
let a = try await fetchUser(id: "1")   // finishes...
let b = try await fetchUser(id: "2")   // ...before this starts
```

If these are independent, that's a latency bug — you've serialized two
things that could overlap. To run them concurrently you start them as tasks
first (`async let`, or a task group) and await afterward:

```swift
async let a = fetchUser(id: "1")   // starts now
async let b = fetchUser(id: "2")   // also starts now, concurrently
let users = try await [a, b]       // await both — total time ≈ max, not sum
```

Recognizing that a chain of `await`s is accidentally serial — and knowing
`async let` / task groups fix it — is a standard senior probe, because it's
a real performance bug that looks like correct code.

## Structured concurrency: child tasks bound to a scope

The "structured" in structured concurrency means child tasks have a
lifetime bounded by a parent scope. A task group's children *cannot outlive
the group* — the group won't return until they've all finished or been
cancelled. This is what prevents orphaned background work leaking past the
function that started it.

```swift
try await withThrowingTaskGroup(of: User.self) { group in
    for id in ids {
        group.addTask { try await fetchUser(id: id) }
    }
    var users: [User] = []
    for try await user in group { users.append(user) }  // collected as they finish
    return users
}   // guaranteed: no child task is still running past this brace
```

Contrast with an unstructured `Task`, which is *not* bound to a scope —
it runs independently and you're responsible for its lifetime and
cancellation. Unstructured tasks are sometimes necessary (bridging from
non-async code, fire-and-forget with explicit management) but they opt out
of the safety structured concurrency provides, so they're the exception,
not the default.

## Cancellation is cooperative

Cancelling a task does *not* forcibly stop it. It sets a flag; the task must
*check* that flag and stop voluntarily — via `try Task.checkCancellation()`
or by observing `Task.isCancelled`. Well-behaved async library calls check
automatically at suspension points, but a tight compute loop that never
checks will run to completion even after cancellation.

```swift
for item in largeBatch {
    try Task.checkCancellation()   // throws CancellationError if cancelled
    process(item)
}
```

This mirrors Kotlin's coroutine cancellation exactly, and the same pitfall
applies: work that ignores cancellation wastes resources and can keep a UI
spinner alive after the user navigated away. When a parent is cancelled,
structured child tasks are automatically marked cancelled — but "marked" is
not "stopped," and honoring it is on you.

> **Interview lens:** Given two independent `await` calls, "make this
> faster" — the answer is `async let` (or a task group) to overlap them, and
> being able to explain *why the original is serial* (each `await` suspends
> until completion before the next line runs). Bonus signal: mentioning that
> cancellation is cooperative, so a cancelled group still needs its children
> to check.

> **Trade-off:** Maximum concurrency isn't automatically better — firing
> thousands of unbounded child tasks can exhaust connections or memory. Task
> groups let you bound width (process in batches), which is often the
> correct engineering choice over "start everything at once."
