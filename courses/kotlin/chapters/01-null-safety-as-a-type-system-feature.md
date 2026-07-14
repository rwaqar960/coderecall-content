---
id: kotlin-01
title: Null Safety as a Type System Feature
minutes: 15
level: senior
---

"Kotlin has null safety" is usually understood as "the compiler yells at you
about nulls" — true, but it undersells what's actually happening. Kotlin
made nullability part of the **type itself**, which means the type system
can make guarantees Java's never could, and understanding those guarantees
precisely is what separates using null safety from fighting it.

## The type is the contract

`String` and `String?` are different types, not the same type with an
optional annotation. A function accepting `String` is guaranteeing — at
compile time, checked on every call site — that it will never receive
null. This is the actual mechanism: Tony Hoare's "billion-dollar mistake"
(null references) is fixed not by runtime checks but by making
nullability a property the type checker enforces, the same way it enforces
that you can't pass a string where an int is expected.

```kotlin
fun greet(name: String) = "Hello, $name"       // name can never be null — guaranteed
fun greetMaybe(name: String?) = "Hello, ${name ?: "stranger"}"  // must handle null
```

Calling `greet(null)` is a **compile error**, not a runtime
`NullPointerException` waiting to happen. This is the entire value
proposition, and it's easy to undersell by calling it "syntax sugar" — it's
a genuine static guarantee, verified for every call in the codebase, not a
convention someone has to remember to follow.

## Safe calls, the Elvis operator, and what they actually do

```kotlin
val length: Int? = name?.length          // safe call: null in, null out, no exception
val length2: Int = name?.length ?: 0     // Elvis: substitute a default for the null case
val length3: Int = name!!.length         // assertion: "I know this isn't null" — or a crash
```

`?.` short-circuits to null instead of throwing — chaining several
(`user?.address?.city?.uppercase()`) is safe by construction, propagating
null through the whole chain rather than crashing partway. `?:` supplies
a fallback value for exactly the null case. `!!` is the deliberate escape
hatch — asserting non-null and converting a potential compile-time
question into a potential *runtime* `NullPointerException` if you're
wrong. Chapter 9 treats `!!` overuse as a named anti-pattern for exactly
this reason: it manually reintroduces the failure mode the whole feature
exists to eliminate.

> **Interview lens:** "What does `!!` actually do, and why would you avoid
> it?" — the strong answer: it's not a null check, it's a null *assertion*
> — the compiler stops verifying and trusts you, and if you're wrong, the
> exact same `NullPointerException` Kotlin was designed to prevent occurs
> anyway, just relocated to wherever the assertion was written instead of
> wherever the bug actually originates.

## Smart casts: the compiler tracking what you just checked

```kotlin
fun printLength(s: String?) {
    if (s != null) {
        println(s.length)   // s is smart-cast to String here — no ?. needed
    }
}
```

After a null check, the compiler **narrows the type** for the rest of that
scope — this is smart casting, and it's not limited to nullability: a type
check (`x is String`) smart-casts `x` to `String` for the rest of that
same branch. The catch: smart casts require the compiler to *prove*
the value can't change between the check and the use — a `var` property
on a class (mutable, and potentially modified by another thread or a
different code path) generally can't be smart-cast, because the guarantee
would be unsound. This is precisely why smart-cast failures cluster around
mutable class properties and why the idiomatic fix is copying to a local
`val` first — the local can't be reassigned out from under the check.

## Platform types: where the guarantee has a real hole

Calling Java code from Kotlin introduces **platform types** — a value from
Java whose nullability Kotlin cannot verify, because Java's type system
doesn't express it. Platform types (shown as `String!` in tooling, though
not writable in source) let you treat the value as either nullable or
non-null, with **no compiler enforcement either way**.

```kotlin
// javaLibrary.getName() returns a Java String — Kotlin doesn't know if it can be null
val name = javaLibrary.getName()   // platform type: Kotlin trusts you, silently
```

This is the honest limitation of the whole system: null safety is a
Kotlin-to-Kotlin guarantee. The moment Java code is in the call chain
(chapter 10 covers interop specifically), the compile-time guarantee stops
at that boundary, and a `NullPointerException` from unchecked platform
types is the most common way null safety "fails" in real Kotlin/Java
mixed codebases — not a flaw in Kotlin's design, but a fact about what the
type system can and can't see across a language boundary.

> **Trade-off:** Treating every platform type defensively (wrapping every
> Java call result in a null check) is the safe default but adds real
> ceremony; trusting well-documented, stable Java APIs not to return null
> is a pragmatic, common choice — the risk is concentrated exactly at
> API boundaries with third-party or legacy code where the actual
> nullability contract is unclear or undocumented.

## Key takeaways

- `String` and `String?` are different types — nullability is enforced by
  the type checker at every call site, a genuine compile-time guarantee,
  not a convention or lint rule.
- `?.` (safe call) propagates null instead of throwing, `?:` (Elvis)
  supplies a fallback, `!!` asserts non-null and reintroduces the crash
  risk the feature exists to eliminate — know which one a line of code is
  actually doing.
- Smart casts narrow a type after a check, but require the compiler to
  prove the value can't change between check and use — mutable `var`
  properties often can't be smart-cast; copying to a local `val` fixes it.
- Platform types (values from Java) carry no compiler-verified nullability
  — the guarantee is Kotlin-to-Kotlin only, and unchecked platform types
  are the most common real source of `NullPointerException` in mixed
  codebases.
