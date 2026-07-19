---
id: swift-07
title: Memory Management — ARC, Retain Cycles, weak/unowned
minutes: 16
level: senior
---

Swift uses Automatic Reference Counting (ARC), not a tracing garbage
collector. That single fact drives a class of bugs — retain cycles — that
don't exist in GC languages, and the tools to fix them (`weak`, `unowned`,
capture lists) are a staple of senior iOS interviews because leaks are a
real, shippable failure mode.

## How ARC works, and where it applies

Every reference-type (class) instance carries a count of strong references
to it. When the count hits zero, the object is deallocated *immediately* —
deterministically, at that point, not "eventually" like a GC. ARC inserts
the retain/release calls at compile time; there's no background collector
and no pause.

Crucially, ARC applies **only to reference types**. Value types (structs,
enums — see chapter 2) are copied, not reference-
counted, so they can't participate in a reference cycle at all. This is
another quiet argument for the struct-by-default habit: values are simply
outside the entire leak category.

## Retain cycles: the failure mode

If object A holds a strong reference to B, and B holds a strong reference
back to A, their counts never reach zero even after everything else lets go
of them. They leak — deterministically, forever, until the process dies.

```swift
class Parent {
    var child: Child?
}
class Child {
    var parent: Parent?   // strong back-reference → cycle
}

var p: Parent? = Parent()
var c: Child? = Child()
p?.child = c
c?.parent = p
p = nil; c = nil          // neither is freed — they keep each other alive
```

The GC-language intuition ("nothing external points at them, so they'll be
collected") is exactly wrong here: ARC only counts references, it doesn't
detect that a cluster is unreachable from the outside.

## weak and unowned: breaking the cycle

The fix is to make one direction of the reference *not* contribute to the
count:

- **`weak`** — does not increase the count, and automatically becomes `nil`
  when the referent is deallocated. Therefore it must be an optional. Use it
  when the reference *can* legitimately outlive or be nil.
- **`unowned`** — does not increase the count, and does *not* become nil;
  it assumes the referent outlives it. Accessing it after the referent is
  gone is a crash. Use it only when the lifetime relationship guarantees the
  referent is always present.

```swift
class Child {
    weak var parent: Parent?    // breaks the cycle; nils out safely
}
```

The choice is a precise judgment: `weak` is the safe default; `unowned` is
an optimization you earn by *proving* the referent can't be gone first
(classically, a child that cannot exist without its parent). Choosing
`unowned` because "it's not optional so it's more convenient" is how you
ship a crash.

## Closures capture strongly — the most common real leak

The parent/child example is textbook; the version that actually bites teams
is a closure capturing `self` strongly. A view controller owns a closure
(say, a network completion handler or a Combine sink), and the closure
captures `self` — now they're a cycle.

```swift
class Loader {
    var onDone: (() -> Void)?
    func start() {
        onDone = {
            self.finish()   // captures self strongly → cycle with the stored closure
        }
    }
    func finish() {}
}
```

The fix is a **capture list** that captures `self` weakly (or unowned),
plus the idiomatic `guard let self` to turn the weak optional back into a
usable reference for the closure body:

```swift
onDone = { [weak self] in
    guard let self else { return }
    self.finish()
}
```

> **Interview lens:** "You have a memory leak in a view controller — how do
> you find and fix it?" A strong answer walks the whole path: reproduce it
> (Instruments' Leaks/Allocations, or the memory graph debugger), identify
> the cycle (usually a stored closure or a delegate held strongly), and fix
> it with `[weak self]` or a `weak` delegate — while explaining *why* the
> cycle formed, not just pattern-matching to "add weak self everywhere."

## Delegates and the `weak` convention

The reason delegate properties are conventionally `weak var delegate` is
exactly this: the delegating object shouldn't keep its delegate alive,
because the delegate (often a parent view controller) typically owns *it*.
A strong `delegate` is a classic accidental cycle.

> **Trade-off:** Sprinkling `[weak self]` on *every* closure is cargo-cult
> defensiveness — a closure that isn't stored (a synchronous `map`, a
> short-lived animation block that self doesn't retain) has no cycle to
> break, and the weak dance adds noise and a `guard` for nothing. The skill
> is recognizing the actual cycle condition — *self stores the closure that
> captures self* — and applying `weak` there, not reflexively everywhere.
