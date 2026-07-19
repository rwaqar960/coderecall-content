---
id: swift-02
title: Value Types vs Reference Types — struct, class, and Copy Semantics
minutes: 16
level: senior
---

The single most consequential design decision in day-to-day Swift is
`struct` versus `class`. It's not a style preference — it changes identity,
mutation, threading, and how bugs manifest. Getting the mental model exact
is what separates Swift written *as Swift* from Swift written as Java with
different keywords.

## The core distinction: copy vs share

A `struct` is a **value type**: assigning it or passing it to a function
copies it. A `class` is a **reference type**: assigning or passing it
shares a reference to one instance. Everything else follows from this.

```swift
struct PointS { var x: Int }
class  PointC { var x: Int; init(x: Int) { self.x = x } }

var a = PointS(x: 1)
var b = a          // COPY — b is independent
b.x = 99
print(a.x)         // 1  — a is untouched

let c = PointC(x: 1)
let d = c          // SHARE — same instance
d.x = 99
print(c.x)         // 99 — c sees the change
```

The value-type case is the one that eliminates a whole category of bugs:
no spooky action at a distance, because nobody else has a handle on *your*
copy. This is why Swift's standard library makes `Array`, `String`,
`Dictionary`, and `Set` all value types.

## "But copying arrays sounds expensive" — copy-on-write

Value semantics for a big collection would be wasteful if every assignment
truly duplicated the storage. Swift's library types use **copy-on-write
(COW)**: the underlying buffer is shared until someone mutates it, and only
then is it actually copied. You get value semantics (nobody sees your
changes) with reference-level performance for reads.

```swift
var first = [1, 2, 3]
var second = first     // no copy yet — shared buffer
second.append(4)       // NOW the buffer is copied, first stays [1,2,3]
```

This is invisible for library types, but if you build your own value type
wrapping a class-based buffer, you have to implement COW yourself (checking
`isKnownUniquelyReferenced` before mutating). Knowing that COW is a
deliberate implementation technique, not a language guarantee that applies
to *your* types automatically, is a staff-level distinction.

## Mutation and `mutating`

Because a struct's methods could change the value — and value changes must
be visible to the variable holding it — a method that mutates `self` must
be marked `mutating`. This also means you can't call a mutating method on a
`let` constant: the constant *is* the value, and mutating it would replace
it.

```swift
struct Counter {
    private(set) var count = 0
    mutating func increment() { count += 1 }
}

let fixed = Counter()
// fixed.increment()  // compile error — cannot mutate a `let` value
```

A class has no `mutating` keyword because mutating a class's property
doesn't change the *reference* — the reference stays the same, only the
pointed-to object changes. That's exactly why you *can* mutate a `let`
class instance's `var` properties, which surprises people coming from the
value-type side.

## Identity vs equality

Reference types have **identity**: two variables can point to the same
object, testable with `===`. Value types have no meaningful identity — only
**equality** (`==`) makes sense, because "the same value" and "an equal
value" are indistinguishable. Reaching for `===` is a signal you're
genuinely reasoning about shared instances, not just comparing data.

> **Interview lens:** "When would you choose a class over a struct?" The
> strong answer names concrete reasons: you need identity (two references
> to *the same* mutable object), you need inheritance, you're interoperating
> with an Objective-C API that requires it, or the type models a genuinely
> shared resource (a database connection, not a data record). Absent those,
> the modern default is `struct`.

## The threading payoff

Value types are the foundation of Swift's data-race safety story (chapter
9). A value copied across a task boundary can't be mutated by two tasks at
once, because each holds its own copy — there's no shared mutable state to
race on. Reference types are exactly where data races live, which is why
`Sendable` checking scrutinizes classes far more than structs. The
`struct`-by-default habit isn't only about local correctness; it's what
makes concurrent code tractable.

> **Trade-off:** Value semantics aren't free everywhere — a genuinely
> shared, long-lived, mutable resource modeled as a struct becomes awkward
> (you end up threading it back out of every function that changes it). The
> skill is matching the semantics to the domain: records and data → value
> types; shared mutable resources and identities → reference types.
