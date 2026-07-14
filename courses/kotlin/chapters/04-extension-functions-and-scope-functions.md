---
id: kotlin-04
title: Extension Functions and Scope Functions
minutes: 14
level: senior
---

Extension functions look like they add methods to a class you don't own
— and for readability purposes, they do. Understanding that they're
**not** actually adding anything to the class (no virtual dispatch, no
new members, resolved entirely at compile time) is what prevents a real
category of bugs that only shows up when polymorphism is involved.

## What an extension function actually is

```kotlin
fun String.isValidEmail(): Boolean = contains("@") && contains(".")

"user@example.com".isValidEmail()   // reads like a method call
```

Under the hood, this compiles to a regular static function taking
`String` as its first parameter — `isValidEmail(receiver: String):
Boolean` — with the compiler rewriting call sites to pass the receiver
implicitly. **Nothing is added to the `String` class itself**; this is
pure syntactic sugar over a static function call, dispatched based on the
**declared (compile-time) type** of the expression, not its runtime type.

## The dispatch trap: extensions don't override

This static-dispatch fact has one sharp, common consequence: extension
functions are resolved by the variable's declared type, exactly like
overloaded functions in the OOP course's polymorphism chapter — **not**
dynamically dispatched like a real member function override would be.

```kotlin
open class Animal
class Dog : Animal()

fun Animal.sound() = "..."
fun Dog.sound() = "Woof"

val pet: Animal = Dog()
pet.sound()   // "..." — resolved by the DECLARED type (Animal), not the actual Dog
```

This is precisely the OOP course's overload-resolution trap from chapter
2, restated for extensions: a real member function override would honor
`Dog`'s actual runtime type; an extension function is resolved
statically, at the call site, based on what the compiler knows the
variable's *type* is, not what it *actually holds*. Extension functions
are a genuinely different mechanism from inheritance-based polymorphism,
despite reading identically at the call site — which is exactly what
makes this trap easy to miss.

> **Interview lens:** "Do extension functions support polymorphism?" —
> the precise answer: no, they're resolved statically by declared type,
> which is why extension functions should never be relied on for
> behavior that needs to vary by an object's actual runtime type — that's
> what member functions and real overriding are for.

## Scope functions: five extension functions on `Any`, with different behavior

`let`, `run`, `with`, `apply`, and `also` are themselves ordinary
extension functions (on `Any?`, meaning every type has them) — they
differ only in two axes: **what they return**, and **how the receiver is
referenced inside the block** (`this` vs `it`).

```kotlin
val length = name?.let { it.length }        // let: block param is `it`, returns block result
val config = Config().apply { timeout = 30 } // apply: block receiver is `this`, returns the receiver
val result = user.also { log(it) }           // also: block param is `it`, returns the receiver
```

- **`let`**: returns the block's result; receiver is `it`. Common for
  null-safe transformation chains, e.g. `name?.let(::process)`.
- **`run`**/**`with`**: returns the block's result; receiver is `this`.
  Useful when the block needs to call several members without repeating
  the receiver name.
- **`apply`**: returns the receiver itself; receiver is `this`. The
  idiomatic choice for object configuration — build, configure, return
  the same object.
- **`also`**: returns the receiver itself; receiver is `it`. Side effects
  (logging, validation) that shouldn't interrupt a chain's actual value.

> **Trade-off:** Choosing among these by "which one looks shortest here"
> produces code that *works* but obscures intent — choosing by "does this
> block produce a new value or configure/observe the existing one, and
> does the block need `this`-style member access or just a reference"
> makes the choice self-documenting. `apply` versus `also` in particular
> encode different intents (configure vs. observe) despite having
> identical signatures otherwise — the choice communicates *why* the
> block exists, not just what it returns.

## The nested-scope-function ambiguity

A real, recurring readability problem: nesting scope functions that both
use `this` as the receiver reference creates ambiguity about which
receiver a bare property name refers to.

```kotlin
class Outer { var name = "outer" }
class Inner { var name = "inner" }

Outer().run {
    Inner().run {
        name   // refers to Inner's name — Outer's is shadowed, easy to misread
    }
}
```

This isn't a bug — Kotlin's shadowing rules are consistent and
documented — but it's a genuine readability cost specific to nesting
`this`-based scope functions (`run`, `with`, `apply`). The practical fix:
prefer `it`-based scope functions (`let`, `also`) when nesting is likely,
or use labeled receivers (`this@Outer.name`) to disambiguate explicitly
when `this`-based nesting is unavoidable.

## Key takeaways

- Extension functions compile to static functions taking the receiver as
  a hidden first parameter — nothing is added to the extended class, and
  resolution happens at compile time based on the declared type.
- This means extension functions do **not** participate in runtime
  polymorphism — calling an extension through a variable typed as a
  supertype resolves to the supertype's extension, even if the actual
  object is a subtype, the same overload-resolution trap as OOP chapter 2.
- The five scope functions (`let`/`run`/`with`/`apply`/`also`) differ on
  two axes: return value (block result vs. receiver) and receiver
  reference (`this` vs. `it`) — choose by what the block is *for*
  (transform, configure, observe), not by which reads shortest.
- Nesting `this`-based scope functions creates real shadowing ambiguity;
  prefer `it`-based functions when nesting, or use labeled receivers
  (`this@Outer`) to disambiguate explicitly.
