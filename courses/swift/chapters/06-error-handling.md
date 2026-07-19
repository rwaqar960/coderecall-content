---
id: swift-06
title: Error Handling — throws, Result, and typed throws
minutes: 15
level: senior
---

Swift's error handling is deliberately *not* exceptions in the Java/C++
sense, even though it borrows the `throw`/`catch` keywords. Errors are
ordinary values, the throwing points are marked in the type system, and the
control flow is explicit at every call. Knowing why it was designed this
way explains when to use `throws`, when to use `Result`, and when neither
is right.

## throws is part of the signature, and calls are marked with try

A function that can fail is annotated `throws`, and every call to it must be
prefixed with `try` — so failure points are visible when *reading* the
code, not hidden like unchecked exceptions.

```swift
enum LoadError: Error {
    case notFound
    case corrupted(reason: String)
}

func loadConfig(at path: String) throws -> Config {
    guard exists(path) else { throw LoadError.notFound }
    // ...
}

let config = try loadConfig(at: "/etc/app")   // `try` marks the failure point
```

Unlike unchecked exceptions, you can't *accidentally* propagate a throw:
either you handle it with `do`/`catch`, mark your own function `throws` to
pass it up, or convert it. That "no silent propagation" property is the
central design goal — errors are as visible as return values because they
essentially *are* return values.

## do / catch and pattern matching on errors

Because errors are values (any type conforming to the error protocol,
usually an enum), you catch them with the same pattern matching used
everywhere else:

```swift
do {
    let config = try loadConfig(at: path)
    use(config)
} catch LoadError.notFound {
    useDefaults()
} catch LoadError.corrupted(let reason) {
    report(reason)
} catch {
    // `error` is bound implicitly here
    log(error)
}
```

Modeling the error type as an enum with associated values (like
`corrupted(reason:)`) is the idiomatic move — it lets callers match
specific cases and carries diagnostic data without stringly-typed hacks.

## try? and try! — the two shortcuts, and their costs

- `try?` converts a throw into an optional: success wraps the value, failure
  becomes nil, discarding *why* it failed.
- `try!` asserts the call won't throw, crashing if it does — the `!` family
  again (see chapter 1), reintroducing a crash for a
  claimed invariant.

```swift
let config = try? loadConfig(at: path)   // Config? — error detail is thrown away
let bundled = try! loadConfig(at: bundledPath)  // crashes if the bundled file is bad
```

`try?` is convenient and often *too* convenient: swallowing the error
means you can't tell "not found" from "corrupted," which matters more often
than people expect. It's the right tool only when any failure genuinely
collapses to "no value," and the reason truly doesn't matter.

## Result — errors as a first-class value you can store and pass

`throws` is synchronous control flow. When you need to *store* an
outcome, pass it through a completion handler, or defer handling, `Result`
holds success-or-failure as a value:

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}
```

Historically `Result` was essential for asynchronous callbacks (the
completion handler carried a `Result`). With async/await (chapter 8), an
async function can just be `throws` and you're back to straight-line
`try`, so `Result` is needed less for pure async flow — but it's still the
right tool when a failure is *data* you carry around (retry queues, caching
an outcome, batch results where each item independently succeeded or
failed).

## typed throws — the recent refinement

Classic `throws` is untyped: the signature says a function throws *some*
error, not *which*. Recent Swift adds typed throws (`throws(LoadError)`),
letting a function declare the exact error type it can throw. This is
valuable in constrained places — exhaustive `catch` with no catch-all,
embedded code avoiding existential boxing — but the guidance from the
language team is deliberately narrow: default to untyped `throws` for most
APIs, because committing to a concrete error type is a versioning
constraint (adding a new error case becomes a breaking change).

> **Interview lens:** "throws vs Result?" The senior framing: `throws` for
> synchronous, immediately-handled control flow (it reads as straight-line
> code); `Result` when the outcome is a *value* you store, defer, or pass —
> and note that async/await removed most of `Result`'s old async use case.
> Claiming one is simply better than the other misses that they solve
> different problems.

> **Trade-off:** Rich enum error types with associated data are more
> precise but more code to define and maintain; a single catch-all error is
> less work but tells callers nothing. Match the granularity to how
> differently callers actually need to *react* — if every failure is handled
> the same way, elaborate error taxonomies are wasted effort.
