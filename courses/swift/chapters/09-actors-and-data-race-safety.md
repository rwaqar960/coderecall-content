---
id: swift-09
title: Actors and Data-Race Safety
minutes: 17
level: staff
---

Actors and the `Sendable` protocol are Swift's answer to the oldest bug in
concurrent programming: two things touching the same mutable state at once.
Swift 6 turns data-race safety from a discipline you hope everyone follows
into something the *compiler* verifies. Understanding the model — actors,
isolation, `Sendable`, and `@MainActor` — is increasingly the dividing line
in senior/staff iOS interviews, because the whole industry is migrating
code through it right now.

## The actor: serialized access to mutable state

An `actor` is a reference type whose mutable state is *isolated* — only one
task can touch it at a time. The compiler enforces this by making access
from outside the actor asynchronous (you `await` it), so calls queue rather
than overlap. It's mutual exclusion built into the type system, without you
writing a lock.

```swift
actor Counter {
    private var value = 0
    func increment() { value += 1 }   // synchronous *inside* the actor
    func current() -> Int { value }
}

let counter = Counter()
await counter.increment()   // `await` from outside — access is serialized
```

Two tasks calling `increment()` concurrently cannot corrupt `value`,
because the actor admits one at a time. This replaces the error-prone
manual locking (`DispatchQueue`, `NSLock`) that used to guard shared state —
and unlike a lock you forgot to take, the compiler *requires* the `await`,
so you can't accidentally skip the protection.

## Actor reentrancy — the subtle trap

Actors are **reentrant**: when an actor method suspends at an `await`, the
actor is free to run *other* queued work before the first method resumes.
So state you read before an `await` may have changed by the time you resume.
This surprises people who assume "one at a time" means "atomic across
awaits" — it doesn't.

```swift
actor ImageCache {
    var cache: [String: Image] = [:]
    func image(for key: String) async -> Image {
        if let cached = cache[key] { return cached }
        let downloaded = await download(key)   // SUSPENDS — other calls can run here
        cache[key] = downloaded                // another call may have already set this
        return downloaded
    }
}
```

Here two concurrent calls for the same key can both miss the cache, both
download, and both write — wasteful, and a bug if writes must be unique. The
fix is to re-check invariants *after* every suspension point, or to store an
in-flight task rather than the result. "Check-then-act across an `await`"
inside an actor is the reentrancy pitfall, and naming it is a staff-level
tell.

## Sendable: what's safe to cross an isolation boundary

`Sendable` marks a type as safe to pass between concurrency domains (across
a task or actor boundary) without introducing a data race. Value types
composed of sendable values are automatically sendable — another payoff of
value semantics (chapter 2), since a copy can't be shared-mutated. A class
with mutable state is *not* sendable unless you prove it's internally
synchronized (e.g. it's an actor, or immutable, or uses a lock and you mark
it `@unchecked Sendable`).

The Swift 6 compiler *checks* this: passing a non-sendable class into a
concurrent context is a compile error, not a lurking runtime race. That
shift — races become build failures — is the entire point of the Swift 6
concurrency model.

## @MainActor: the UI thread as a type-system rule

UI frameworks require updates on the main thread. `@MainActor` encodes that
as isolation: anything annotated `@MainActor` runs on the main actor, and
the compiler forces you to `await` when hopping onto it from background
code. "UIKit must be touched on the main thread" stops being a documentation
convention you can violate and becomes a checked rule.

```swift
@MainActor
final class ViewModel: ObservableObject {
    @Published var title = ""      // mutated only on the main actor
    func load() async {
        let data = await fetch()   // runs off the main actor
        title = data.title         // back on the main actor — compiler-guaranteed
    }
}
```

> **Interview lens:** "How does Swift prevent data races?" A staff-level
> answer connects the pieces: actors serialize access to mutable state,
> `Sendable` governs what may cross isolation boundaries, `@MainActor` pins
> UI work to the main thread, and Swift 6 makes violations *compile errors*.
> Bonus: raising actor reentrancy unprompted signals real depth, because
> it's the one place "actors make it safe" is too glib.

> **Trade-off:** Actor isolation isn't free — over-isolating turns
> everything into `await` calls and can serialize work that didn't need to
> be, hurting throughput. And migrating a large codebase to Swift 6 strict
> checking surfaces real friction (`@unchecked Sendable` escape hatches,
> annotation churn). The judgment is isolating the genuinely shared mutable
> state, not wrapping every type in an actor reflexively.
