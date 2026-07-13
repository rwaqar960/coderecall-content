---
id: oop-09
title: Design Patterns That Still Matter
minutes: 16
level: senior
---

The Gang of Four cataloged 23 patterns in 1994. Thirty years later, some are
load-bearing vocabulary you use weekly, some were workarounds for missing
language features, and a few are traps wearing a respectable name. A senior
engineer's job isn't reciting the catalog — it's knowing which is which, and
recognizing the patterns already living (unnamed) in their codebase.

## Still load-bearing

**Strategy** — behavior as an injected object — has won so thoroughly it's
invisible: every comparator, every retry policy, every lambda-typed
parameter is a strategy. In languages with first-class functions, Strategy
*is* "pass a function"; the class-based form survives when the strategy has
state or multiple methods.

**Decorator** — same interface, wrapped behavior (chapter 3's composition
answer). Your HTTP client middleware, `BufferedInputStream`, and every
logging/caching/retrying repository wrapper. The stackability is the point.

**Adapter** — translating a foreign interface into the one your domain
owns. This is DIP's workhorse (chapter 6): the domain defines the port, the
adapter wraps the vendor SDK. When people say "wrap the third-party
library," they mean Adapter.

**Observer** — the pattern that ate the world and changed names:
listeners, event emitters, streams, `ValueNotifier`, pub/sub, LiveData.
The GoF form is rare; the concept is everywhere. The senior-level content
is its *failure modes*: leaked subscriptions (the #1 memory leak in UI
code), reentrancy (an observer mutating the observable mid-notification),
and unclear delivery ordering.

**Factory Method / Abstract Factory** — still the answer when construction
requires a decision the caller shouldn't make. In practice, mostly absorbed
into DI containers and simple static factory methods (`Duration.ofSeconds`,
`List.of`) — the named pattern matters less than the principle: *give
construction a home when it embeds logic.*

**Facade** — a simple front door for a messy subsystem. Every well-designed
module boundary is a facade whether or not anyone says so.

## Absorbed by languages

Knowing these saves you from writing museum-piece code:

- **Iterator** → `for (x in xs)`, `Iterable`, generators. Done.
- **Command** → lambdas + closures cover 90%; the class form earns its keep
  only with undo/redo state or serialized commands (job queues).
- **Template Method** → still works, but "pass the varying step as a
  function" (Strategy-ification) usually beats inheritance for the reasons
  in chapter 3.
- **Prototype** → `copyWith`, record `with`-ers, structured cloning.
- **Builder** — half-absorbed: Kotlin/C# named+default arguments kill the
  Java form; it survives where construction is genuinely multi-step or
  validation-heavy (and as chapter 7's mutation escape hatch).

## Handle with care

**Singleton** is the famous one — global mutable state with a design-pattern
alibi. The problem was never "one instance"; it's the *global access point*:
hidden dependencies (nothing in a signature reveals `Config.instance()`
calls), untestable state bleeding between tests, and initialization-order
puzzles. The modern resolution keeps single instances but injects them —
"one instance" becomes a *wiring decision* owned by the composition root,
not a property hardcoded into the class. If you must keep one, make it
immutable (chapter 7 pays off again).

> **Interview lens:** "What's wrong with Singleton?" — the weak answer is
> "it's global." The strong answer: "it makes dependencies invisible in
> signatures and couples every consumer to one concrete instance, which is
> exactly what dependency injection exists to fix; the single-instance
> property itself is fine when the composition root owns it."

**Visitor** — legitimately powerful for the expression problem's
operations-axis (chapter 2), but in languages with sealed types and pattern
matching, an exhaustive switch does the same job with a third of the
ceremony. Reach for Visitor only without those features, or when
double-dispatch is genuinely required.

## Patterns are vocabulary, not targets

Two staff-level truths about patterns as a practice:

1. **They're compression for design conversations.** "Decorate the client
   with retry" transmits a paragraph of design in five words — that's the
   enduring value, and why you learn the names even for patterns you'd
   never hand-roll.
2. **Pattern-first design is backwards.** The failure mode of every
   pattern-educated generation: `AbstractSingletonProxyFactoryBean`.
   Patterns *earn* their way in as refactorings when a design pressure
   appears — chapter 5's rule (abstract on demonstrated variation) applies
   to patterns too.

> **Trade-off:** Under-patterning costs you shared vocabulary and proven
> solutions to recurring shapes; over-patterning costs indirection, class
> count, and onboarding time. The asymmetry: it's much easier to introduce
> a pattern into simple code than to remove one from clever code. When
> unsure, stay simple.

## Key takeaways

- Weekly workhorses: Strategy (usually as lambdas), Decorator, Adapter,
  Observer (as streams/listeners), factories-as-construction-homes, Facade.
- Iterator, Command, Prototype, and much of Builder/Template Method are now
  language features — writing the GoF form is usually a smell.
- Singleton's disease is the global access point, not the single instance;
  inject the instance and the pattern becomes wiring.
- Visitor is a fallback where sealed types + exhaustive matching are absent.
- Learn patterns as *vocabulary* and apply them as *refactorings under
  pressure* — never as up-front targets.
