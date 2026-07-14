---
id: kotlin-07
title: "Delegation: by, Property Delegates, and Composition Over Inheritance"
minutes: 15
level: senior
---

The OOP course's composition chapter made the case for delegation as the
safer alternative to inheritance, then had to spend a paragraph
apologizing for the forwarding boilerplate Java forces on you to actually
use it. Kotlin's `by` keyword removes that apology — class delegation is
a first-class language feature, not a manually-written wrapper. This is
composition-over-inheritance with the boilerplate problem actually solved.

## Class delegation: `by` generates the forwarding

```kotlin
interface Repository { fun save(item: Item) }

class SqlRepository : Repository {
    override fun save(item: Item) { /* real implementation */ }
}

class AuditedRepository(
    private val inner: Repository,
    private val log: AuditLog
) : Repository by inner {              // forwards Repository's methods to `inner`
    override fun save(item: Item) {     // override just this one
        log.record("save", item)
        inner.save(item)
    }
}
```

`Repository by inner` generates forwarding implementations for *every*
method on `Repository` that isn't explicitly overridden — the OOP
course's decorator pattern, with the forwarding boilerplate the language
now writes for you. Add a tenth method to `Repository` and every existing
`by`-delegating class picks it up automatically, correctly forwarded,
with zero code changes — this is the concrete difference between
"composition is theoretically better" and "composition has no practical
cost left to weigh against inheritance."

> **Interview lens:** "Why does Kotlin's `by` keyword matter, beyond
> syntax convenience?" — the strong answer names what it actually
> removes: the OOP course's honest cost accounting for composition
> (forwarding boilerplate) is largely solved at the language level, which
> shifts the inheritance-vs-composition trade-off further toward
> composition than it was in languages requiring hand-written forwarding.

## Property delegates: the same `by`, applied to state

A **property delegate** intercepts a property's get/set through an object
implementing `getValue`/`setValue` — the standard library ships several
genuinely useful ones:

```kotlin
val expensive: Config by lazy { loadConfigFromDisk() }   // computed once, on first access

var name: String by Delegates.observable("") { _, old, new ->
    println("changed from $old to $new")                  // runs on every reassignment
}

val settings: Map<String, String> by mapAccessor            // property backed by a map lookup
```

`lazy` defers expensive initialization until first actual use (and, by
default, is thread-safe — synchronized so concurrent first-access from
multiple threads only computes once). `Delegates.observable` runs a
callback on every change, a lightweight alternative to hand-rolling a
custom setter with manual change-notification logic. Both are the same
underlying mechanism as class delegation — intercepting an operation and
routing it through a delegate object — applied to individual properties
instead of whole interfaces.

## Writing your own delegate: the actual mechanism

```kotlin
class LoggingDelegate<T>(private var value: T) {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): T {
        println("read ${property.name}")
        return value
    }
    operator fun setValue(thisRef: Any?, property: KProperty<*>, newValue: T) {
        println("wrote ${property.name} = $newValue")
        value = newValue
    }
}

var tracked: Int by LoggingDelegate(0)
```

Any class providing `operator fun getValue`/`setValue` with this exact
signature can be used as a delegate — this is compile-time structural
typing (the delegate doesn't need to implement any particular interface,
just have the right operator functions), the same "shape, not declared
type" flexibility Kotlin's operator overloading generally uses. This is
worth knowing precisely because it demystifies `by`: it's not special
compiler magic tied to a fixed set of built-in delegates, it's a
general-purpose mechanism anyone can extend.

## When delegation isn't the right tool

> **Trade-off:** Class delegation solves *is-a-relative-to-an-interface,
> reuses-an-implementation* — it doesn't solve every reuse problem. If
> two classes need to share behavior that isn't naturally expressible as
> "forward to one interface, override a few methods," delegation forces
> an awkward fit; plain composition (holding a reference, calling methods
> explicitly, no `by`) or a shared base class (when a true is-a
> relationship genuinely holds, chapter 3 of the OOP course's substitut-
> ability test) may fit better. `by` removes delegation's *boilerplate*
> cost, not its *conceptual* fit requirement — it's still worth asking
> whether delegation is the right pattern before reaching for the
> keyword that makes it cheap to write.

## Key takeaways

- `class X(...) : Interface by delegate` generates forwarding for every
  interface method not explicitly overridden — Kotlin solving the OOP
  course's composition-boilerplate cost at the language level, not just
  reducing it.
- New interface methods are automatically, correctly forwarded by every
  existing delegating class with zero code changes — a real, ongoing
  maintenance benefit, not just a one-time convenience.
- Property delegates (`by lazy`, `Delegates.observable`, custom ones) are
  the same underlying mechanism — intercept get/set, route through a
  delegate object — applied to individual properties.
- Any class with the right `getValue`/`setValue` operator function
  signatures can be a property delegate — structural, not tied to a fixed
  built-in set, which is what makes the mechanism genuinely extensible.
- `by` removes delegation's boilerplate cost, not its conceptual fit
  question — still worth checking whether "forward to one interface,
  override a few methods" is actually the right shape for the reuse
  problem at hand.
