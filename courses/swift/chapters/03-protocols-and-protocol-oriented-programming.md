---
id: swift-03
title: Protocols and Protocol-Oriented Programming
minutes: 16
level: senior
---

Swift's headline design idea — announced at WWDC as "protocol-oriented
programming" — is that abstraction should center on *what a type can do*
(protocols) rather than *what a type is* (a base class). For engineers
arriving from a class-inheritance background (see the OOP course), this
is a genuine shift in where you put shared behavior, and misapplying it
produces some of the most common Swift design mistakes.

## Protocols as contracts

A protocol declares requirements — methods, properties, initializers — that
a conforming type must satisfy. Unlike a base class, a protocol carries no
stored state and a type can conform to many of them. This is composition
over inheritance made a first-class language feature: you assemble
capabilities rather than inheriting down a single chain.

```swift
protocol Identifiable {
    var id: String { get }
}

protocol Cacheable {
    func cacheKey() -> String
}

struct User: Identifiable, Cacheable {   // conforms to both — no single base class
    let id: String
    func cacheKey() -> String { "user-\(id)" }
}
```

Because a struct (a value type — see chapter 2) can
conform to protocols, you get polymorphism *without* giving up value
semantics. That combination — abstraction plus value types — is the thing
class-based languages can't easily offer, and it's the heart of the POP
pitch.

## Protocols with associated types

A protocol can leave a type unspecified, to be filled in by each conformer,
using an associated type. The standard library's collection protocols are
built this way — a sequence declares the element type it produces as an
associated type rather than committing to one.

```swift
protocol Container {
    associatedtype Item
    mutating func append(_ item: Item)
    var count: Int { get }
}
```

The consequence, which trips people up constantly, is that a protocol with
an associated type has no single concrete shape, so it can't always be used
as an ordinary variable type the way a simple protocol can. That limitation
is the whole reason `some` and `any` exist (chapter 5) — worth flagging now
so it doesn't feel arbitrary later.

## Protocol composition and constraints

You can require conformance to several protocols at once with `&`, and you
can constrain generic code to "any type that conforms," which is usually
better than accepting a concrete type:

```swift
func store(_ value: Identifiable & Cacheable) { /* ... */ }
```

This reads as "I don't care what this *is*; I care that it's identifiable
and cacheable" — the POP mindset in one line. It's also more testable: a
test can pass a tiny fake conforming type instead of constructing a real
one.

## Where POP goes wrong

The failure mode is treating protocols as a religion. Two common smells:

1. **Protocolizing everything up front.** Extracting a protocol for a type
   that has exactly one conformer, with no test seam or second
   implementation in sight, is speculative abstraction — cost now, benefit
   maybe never. Protocols earn their place when there's a real second
   conformer or a real mocking need.

2. **Recreating inheritance with protocols.** Building deep protocol
   hierarchies that inherit from each other, mirroring exactly the class
   tree you were avoiding, gets you the rigidity of inheritance with extra
   indirection. The point of POP is flat composition, not a differently
   spelled hierarchy.

> **Interview lens:** "When would you use a protocol vs a concrete type?"
> The senior answer ties it to *variation points*: use a protocol where you
> genuinely expect multiple implementations or need a test double; use the
> concrete type otherwise. "Always program to a protocol" is a junior
> heuristic that produces abstraction sprawl.

## Protocols vs classes for shared behavior

If shared *behavior* (not just a contract) is what you need, Swift's answer
is protocol *extensions* — default method implementations attached to the
protocol itself (chapter 4). That's how POP delivers code reuse without a
base class. But protocol extensions have a genuinely surprising dispatch
rule that causes real bugs, which is exactly why it gets its own chapter
next.

> **Trade-off:** Protocols decouple, but every protocol is also indirection
> a reader has to follow to find the real implementation. The right amount
> is driven by how much genuine variation exists — not by a blanket rule to
> abstract everything.
