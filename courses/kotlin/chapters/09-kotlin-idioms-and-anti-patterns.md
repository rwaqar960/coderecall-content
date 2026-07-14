---
id: kotlin-09
title: Kotlin Idioms and Anti-Patterns
minutes: 14
level: senior
---

Every language accumulates a gap between "code that compiles" and "code
that's actually idiomatic" — Kotlin's gap is unusually wide because it's
so easy to write Kotlin that's really just Java with different keywords,
missing everything the previous eight chapters covered. This chapter
names the recognizable anti-patterns directly, and why each one forfeits
something real.

## `!!` overuse: reintroducing chapter 1's eliminated bug class

```kotlin
// Anti-pattern: !! everywhere "just to make the compiler happy"
val name = user!!.profile!!.displayName!!

// Idiomatic: handle the null case explicitly, once
val name = user?.profile?.displayName ?: "Unknown"
```

Chapter 1 was explicit: `!!` isn't a null check, it's an assertion that
manually reintroduces the exact `NullPointerException` risk null safety
exists to eliminate. A codebase with `!!` scattered throughout has, in
effect, opted large parts of itself back into Java's null-handling risk
profile while paying Kotlin's verbosity cost for the type annotations —
the worst of both. The idiomatic fix is almost always available: safe
calls, Elvis defaults, or (when a null genuinely should never happen)
restructuring the code so the type system proves it rather than
asserting it.

## `lateinit` misuse: deferring initialization vs. hiding a real dependency

```kotlin
class UserRepository {
    lateinit var apiClient: ApiClient   // must be set before use, or crashes

    fun fetchUser(id: String) = apiClient.get(id)   // UninitializedPropertyAccessException risk
}
```

`lateinit` exists for a real, narrow case: dependency-injection frameworks
or Android lifecycle callbacks (`onCreate`) that populate a property after
construction but before real use, where making it nullable would force
null-checking a value you know will always be set by the time it
matters. The anti-pattern is using `lateinit` to **paper over a
constructor that should have taken the dependency directly** — if
`apiClient` is always available at construction time, it belongs in the
primary constructor, not deferred with a runtime crash risk for no
structural reason.

> **Interview lens:** "When is `lateinit` appropriate?" — the strong
> answer names the actual constraint it exists for: the value genuinely
> isn't available at construction time (a framework populates it later),
> not "I don't want to make the constructor parameter list longer."

## Data class overreach: identity types masquerading as values

Chapter 2 named this directly: a `data class` for an entity compared by
identity (a database-backed `User`) is a category error, not a style
choice. The idiom worth internalizing: reach for `data class` by
asking "is this a value?" (interchangeable if content matches), not "does
this need a constructor with some fields?"

## Unnecessary companion objects: reaching for "static" out of habit

```kotlin
// Anti-pattern: companion object used purely as a namespace, Java-habit style
class StringUtils {
    companion object {
        fun capitalize(s: String) = s.replaceFirstChar { it.uppercase() }
    }
}

// Idiomatic: a top-level function — Kotlin doesn't require a class to hold it
fun capitalizeWord(s: String) = s.replaceFirstChar { it.uppercase() }
```

Kotlin, unlike Java, allows functions to exist outside any class entirely
— a `companion object` used purely to simulate Java's static methods,
with no actual need for a companion (no factory method needing access to
private constructors, no constants tightly coupled to the class) is
importing a Java habit into a language that doesn't need it. The
idiomatic default: a top-level function or a file-scoped constant, unless
the companion genuinely needs the class association (implementing an
interface on the companion itself, or a factory method that needs
privileged constructor access).

## Exceptions vs. `Result`/sealed error types

```kotlin
// Common but not always ideal: exceptions for expected, recoverable failure
fun parseAge(input: String): Int {
    return input.toIntOrNull() ?: throw IllegalArgumentException("not a number")
}

// Idiomatic for EXPECTED failure: return type encodes the failure explicitly
sealed interface ParseResult
data class Parsed(val value: Int) : ParseResult
data class Failed(val reason: String) : ParseResult

fun parseAgeSafely(input: String): ParseResult =
    input.toIntOrNull()?.let { Parsed(it) } ?: Failed("not a number")
```

This is chapter 3's exhaustive-`when` payoff applied to error handling:
an exception is invisible in a function's signature (nothing forces a
caller to handle it, or even know it's possible without reading the
implementation or documentation); a sealed result type is visible and
compiler-enforced at every call site via exhaustive `when`. Exceptions
remain the right tool for genuinely exceptional, unrecoverable, or
programming-error conditions (an assertion failure, a truly unexpected
state) — the idiom is reserving them for that, not for ordinary,
expected failure paths a caller is meant to handle.

> **Trade-off:** Sealed result types add real ceremony (defining the
> success/failure cases, exhaustive handling at every call site) that a
> quick internal script doesn't need — exceptions remain simpler for
> low-stakes, small-scope code. The idiom is choosing based on whether
> callers *need* to be forced to handle the failure case, not applying
> either pattern uniformly everywhere.

## Key takeaways

- `!!` overuse manually reintroduces the exact crash risk null safety
  exists to eliminate — reach for safe calls and Elvis defaults first;
  restructure so the type system proves non-nullability rather than
  asserting it, when possible.
- `lateinit` fits a narrow case (value genuinely unavailable at
  construction, populated later by a framework) — using it to avoid a
  longer constructor parameter list is papering over a real dependency
  with a runtime crash risk.
- `data class` answers "is this a value?" — using it for identity-based
  entities is the same category error chapter 2 named, not a style choice.
- A companion object used purely as a namespace for what could be a
  top-level function is importing a Java habit Kotlin doesn't require —
  reserve companions for genuine class-association needs (factory access,
  interface implementation).
- Exceptions are invisible in a signature; sealed result types are
  visible and compiler-enforced via exhaustive `when` — reserve
  exceptions for genuinely exceptional conditions, sealed results for
  expected, caller-must-handle failure paths.
