---
id: kotlin-08
title: "Generics and Variance: in/out, Reified Types"
minutes: 16
level: staff
---

Java's wildcard generics (`? extends T`, `? super T`) are notorious for
being simultaneously essential and hard to reason about — most Java
developers apply "PECS" (producer-extends, consumer-super) as a
memorized rule without a working model of *why* it's true. Kotlin moved
variance to the **declaration site**, and understanding why that's
possible — and what it costs — turns the memorized rule into something
derivable.

## The variance problem, stated precisely

Is a list of dogs a subtype of a list of animals? Intuitively yes — a
list of dogs seems safely usable wherever a list of animals is expected.
But if that list type were mutable, this would be unsound: code
expecting a list of animals could insert a cat into what's actually a
list of dogs. **Variance rules exist entirely to answer this question
safely** — and the answer depends on whether the type is used in a way
that could actually cause harm.

## `out`: declaring "this type only appears in output positions"

```kotlin
interface Producer<out T> {
    fun produce(): T          // T only ever comes OUT
}

val dogProducer: Producer<Dog> = object : Producer<Dog> {
    override fun produce() = Dog()
}
val animalProducer: Producer<Animal> = dogProducer   // legal! Producer is declared "out"
```

`out T` is a **compiler-checked promise**: the type parameter may only
appear in "out" positions (return types), never as a function parameter.
Given that promise, a producer of dogs being usable as a producer of
animals is provably safe — nothing can ever ask a dog-producer to
*accept* an animal it can't handle, because `out` forbids the type
parameter from ever being a parameter type in the first place. This is
why Kotlin's own read-only list type is covariant this way (a list of
dogs *is* a list of animals) while the mutable list type — which has an
`add` method, an "in" position — is not.

## `in`: declaring "this type only appears in input positions"

```kotlin
interface Consumer<in T> {
    fun consume(item: T)      // T only ever comes IN
}

val animalConsumer: Consumer<Animal> = object : Consumer<Animal> {
    override fun consume(item: Animal) { }
}
val dogConsumer: Consumer<Dog> = animalConsumer   // legal! Consumer is declared "in"
```

This is the mirror image, and the direction reverses correctly: a
consumer of animals (something that can handle *any* animal) is safely
usable as a consumer of dogs (something that only needs to handle dogs)
— anything that can consume the general case can obviously consume the
specific case. `in` is a compiler-checked promise that the type
parameter only appears as a parameter, never as a return type, which is
exactly what makes this substitution provably safe.

> **Interview lens:** "Explain PECS" (producer-extends, consumer-super,
> Java's wildcard mnemonic) — the strong Kotlin-side answer translates it
> directly: a type that only *produces* a value should be declared
> covariant with `out` (`out T`); a type that only *consumes* a value
> should be declared contravariant with `in` (`in T`) — and explaining
> *why* (the substitution is only unsound in the position variance
> forbids) is what shows understanding versus reciting the mnemonic.

## Declaration-site vs. use-site: what Kotlin actually changed

Java requires wildcards at every **use site** — the equivalent of
writing "a list of things that extend Animal" wherever it's needed, over
and over. Kotlin lets the variance be declared **once**, at the
interface or class definition, and every use site inherits it
automatically. This is possible specifically because the compiler
verifies the position constraint (`out` = only return positions, `in` =
only parameter positions) *once*, at the declaration — after which every
usage is guaranteed safe without needing to re-annotate. The trade-off:
declaration-site variance requires committing to one variance for the
*whole* type, everywhere it's used — Java's use-site wildcards allow
different variance at different call sites for the same unannotated
generic type, a flexibility Kotlin trades away for the ergonomic win.

## Reified types: solving type erasure, but only for `inline` functions

Generic type parameters are normally erased at runtime — the JVM doesn't
know what a generic type parameter actually is at runtime, only that a
container holds *something*. This is why you normally can't check a
value's type directly against a generic type parameter, or get its class
reference. An `inline` function with a `reified` type parameter is the
one exception:

```kotlin
inline fun <reified T> Any?.isInstance(): Boolean = this is T

"hello".isInstance<String>()   // true — T is actually known at the call site
```

This works because `inline` functions are **copied into the call site at
compile time** — by the time the compiler generates code for that call,
it literally substitutes the type parameter with the real type
textually, so there's no runtime erasure to work around; the type check
compiles to an ordinary, direct type check. This is why `reified`
requires `inline` — it's not a runtime feature at all, it's a
compile-time code-generation trick that only works because the generic
function's body doesn't actually exist as generic code at runtime.

> **Trade-off:** `inline` functions avoid the overhead of an actual
> function call (and enable `reified`), at the cost of code size — the
> function's body is duplicated at every call site. For small functions
> called in hot paths, or specifically to unlock `reified`, this is a
> clear win; inlining a large function used in hundreds of places bloats
> the compiled output for no corresponding benefit.

## Key takeaways

- Variance answers one question: can a generic type at one type argument
  safely substitute for the same type at a different, related type
  argument? The answer depends on whether the type parameter is used
  only in output positions (`out`, covariant-safe), only input positions
  (`in`, contravariant-safe), or both (invariant — no safe substitution
  either direction).
- `out`/`in` are compiler-checked promises about *where* the type
  parameter can appear — the compiler enforces the position restriction,
  which is what makes the resulting substitution provably safe, not just
  conventionally assumed.
- Kotlin's declaration-site variance (annotate once, at the type
  definition) trades away Java's per-use-site flexibility for not needing
  to repeat wildcard annotations everywhere the type is used.
- `reified` type parameters solve type erasure, but only inside `inline`
  functions — because inlining copies the function body into the call
  site at compile time, substituting the real type textually, with no
  runtime erasure left to work around.
