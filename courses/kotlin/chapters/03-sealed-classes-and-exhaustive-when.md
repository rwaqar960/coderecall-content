---
id: kotlin-03
title: Sealed Classes and Exhaustive when
minutes: 15
level: senior
---

The Algorithms course's expression-problem discussion (via OOP chapter 2)
named the trade-off precisely: an open, virtual-dispatch hierarchy makes
adding new *types* cheap and new *operations* expensive; a closed,
switch-on-type hierarchy inverts that. Kotlin's `sealed` keyword is the
language committing to the second choice deliberately, with compiler
enforcement most languages can't offer.

## What `sealed` actually restricts

A `sealed class` or `sealed interface` can only be subclassed within the
same module (and, since Kotlin 1.5, the same package) — the compiler
knows the **complete set** of possible subtypes at compile time, because
no code outside that boundary can add another one.

```kotlin
sealed interface PaymentResult
data class Success(val transactionId: String) : PaymentResult
data class Declined(val reason: String) : PaymentResult
data object NetworkError : PaymentResult
```

This closed-world knowledge is what makes exhaustiveness checking
possible at all — the compiler can only guarantee "you've handled every
case" if it can enumerate every case, which requires exactly the
restriction `sealed` imposes.

## Exhaustive `when`: the compiler as a checklist

```kotlin
fun handle(result: PaymentResult): String = when (result) {
    is Success -> "Paid: ${result.transactionId}"
    is Declined -> "Declined: ${result.reason}"
    NetworkError -> "Retry needed"
    // no `else` branch — and none is needed
}
```

Used as an expression (assigned to a value or returned), `when` over a
sealed type **must** cover every subtype or the code doesn't compile — no
`else` branch is needed, and adding one is actually a mistake: it silently
swallows the compiler's exhaustiveness check, so a *new* subtype added
later falls into `else` unnoticed instead of causing a compile error at
every `when` that needs updating.

> **Interview lens:** "Why avoid an `else` branch on a `when` over a
> sealed class?" — the strong answer: exhaustiveness checking is the
> entire value of sealing the hierarchy in the first place; an `else`
> branch converts a compile-time safety net (every `when` site flags when
> a new case needs handling) into a silent runtime gap (new cases fall
> through unnoticed) — it's not a style preference, it removes the
> feature's actual benefit.

## The concrete payoff: adding a case is a guided compile error

This is the practical difference from an unsealed hierarchy or a plain
enum-with-`when`: adding a new subtype to a sealed hierarchy makes
**every** non-exhaustive `when` in the codebase a compile error, pointing
at exactly the sites that need updating.

```kotlin
data class Pending(val estimatedSeconds: Int) : PaymentResult   // new case added

// Every existing `when (result) { ... }` without an else branch now
// fails to compile until Pending is handled — the compiler enumerates
// every site that needs attention; nothing can be silently forgotten.
```

Compare this to Java's traditional `enum` + `switch` (before sealed
interfaces), or any open class hierarchy relying on manual vigilance to
find every place that switches on type — the sealed-plus-exhaustive-`when`
combination converts "did I remember every call site?" from a
code-review question into a compiler guarantee.

## `sealed class` vs `sealed interface`, and `data object`

- **`sealed class`**: subtypes can share state and behavior via
  inheritance from the sealed class itself — useful when variants have
  meaningful common properties.
- **`sealed interface`**: subtypes implement it, with no shared
  implementation inheritance — useful when the variants are otherwise
  unrelated types that just need to be treated uniformly at certain call
  sites (a class can also implement multiple sealed interfaces, which a
  `sealed class` hierarchy's single-inheritance model doesn't allow).
- **`data object`**: a singleton (only one instance ever exists, like
  Kotlin's plain `object`) with `data class`-quality `toString()` — the
  right choice for a sealed hierarchy's cases with **no payload**
  (`NetworkError` above needs no fields, just a distinguishable type), as
  opposed to a `data class` with zero constructor parameters, which
  `data object` replaced specifically for this purpose in modern Kotlin.

## When sealed hierarchies are the wrong tool

> **Trade-off:** Sealing a hierarchy is a permanent, load-bearing
> decision about where variation is *allowed* — appropriate specifically
> when the set of cases is genuinely closed and known (a payment result,
> a network response, a UI state machine's states). If the actual
> requirement is a plugin architecture where third parties or separate
> modules need to add new cases without modifying your source (chapter 2
> of the Algorithms course's open-hierarchy side of the expression
> problem), sealing is actively the wrong choice — it structurally
> prevents exactly that extensibility. Choosing `sealed` is choosing
> "closed by design," not a default to reach for everywhere a hierarchy
> exists.

## Key takeaways

- `sealed` restricts subclassing to the same module (Kotlin 1.5+: same
  package), giving the compiler complete, enumerable knowledge of every
  subtype — the precondition for exhaustiveness checking to work at all.
- `when` used as an expression over a sealed type must cover every case
  or fail to compile; omitting `else` (not adding one defensively) is
  what preserves this guarantee — an `else` branch silently defeats it.
- Adding a new subtype to a sealed hierarchy turns every non-exhaustive
  `when` into a compile error, converting "did I update every call site?"
  from a manual/code-review concern into a compiler-enforced one.
- `sealed class` shares implementation via inheritance; `sealed interface`
  allows multiple implementation and no shared state; `data object` is
  the right choice for payload-free cases, replacing zero-parameter data
  classes.
- Sealing is a deliberate closed-world choice — right for genuinely fixed
  case sets, actively wrong for anything needing third-party or
  cross-module extensibility, which needs the open, virtual-dispatch side
  of the expression problem instead.
