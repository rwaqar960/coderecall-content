---
id: oop-02
title: Polymorphism Beyond Overriding
minutes: 14
level: senior
---

Ask a mid-level developer what polymorphism is and you'll hear "method
overriding." That's one-third of the answer. Senior engineers work with three
distinct kinds of polymorphism daily — often in the same file — and knowing
which one to reach for is a design decision, not a vocabulary quiz.

## The three kinds

**Subtype polymorphism** — one interface, many implementations, dispatched at
runtime:

```java
PaymentMethod method = resolve(request);
method.charge(amount); // card? wallet? bank transfer? decided at runtime
```

**Parametric polymorphism** — generics. One implementation that works
uniformly across types it never inspects:

```java
<T> List<T> firstN(List<T> items, int n) { ... } // knows nothing about T
```

**Ad-hoc polymorphism** — overloading: same name, different signatures,
resolved at **compile time** based on static types.

The senior-level distinction: subtype polymorphism varies *behavior*,
parametric polymorphism varies *data*, and overloading is mostly a naming
convenience. Mixing them up produces real bugs.

## The static dispatch trap

Overload resolution happens at compile time against the *declared* type:

```java
void log(Object o)  { out.println("object: " + o); }
void log(String s)  { out.println("string: " + s); }

Object x = "hello";
log(x); // prints "object: hello" — not "string: hello"
```

Overriding dispatches on the runtime type of the *receiver*; overloading
selects on the compile-time type of the *arguments*. Java, C#, Kotlin, and
C++ all behave this way (C# `dynamic` and Kotlin smart casts blur it, but the
rule stands). Interviewers love this trap; production code is where it does
real damage — typically in logging, serialization, and `equals`-style APIs.

> **Interview lens:** "What's the difference between overloading and
> overriding?" is a screener; the follow-up that separates seniors is *when
> does each get resolved, and what does that mean for a variable typed as a
> superclass?*

## Behavior varies, or data varies?

A reliable design heuristic when you notice branching on type:

```java
if (shape instanceof Circle c) { area = PI * c.r() * c.r(); }
else if (shape instanceof Square s) { area = s.side() * s.side(); }
```

- If the *set of behaviors* is open (plugins, payment providers, shapes that
  others will add): use **subtype polymorphism** — new cases arrive as new
  classes, no existing code changes.
- If the *set of cases* is closed and known (an expression tree, a protocol's
  message kinds): a **sealed hierarchy + exhaustive switch** is often better —
  the compiler tells you every place to update when a case is added.

```java
sealed interface Shape permits Circle, Square, Triangle {}

double area(Shape s) = switch (s) {
    case Circle c   -> PI * c.r() * c.r();
    case Square sq  -> sq.side() * sq.side();
    case Triangle t -> 0.5 * t.base() * t.height();
}; // adding a Shape breaks compilation here — that's a feature
```

> **Trade-off:** This is the *expression problem*. Virtual dispatch makes it
> cheap to add new **types** but expensive to add new **operations** (every
> class changes). Switch-on-sealed-type makes it cheap to add new
> **operations** but expensive to add new **types** (every switch changes).
> Neither is "more OO-correct" — pick based on which axis of your system
> actually grows.

## Generics: don't fake parametricity

A generic method that inspects its type parameter is lying about being
generic:

```java
<T> void process(T item) {
    if (item instanceof Invoice inv) { ... } // not parametric — a disguised overload
}
```

This forfeits the core benefit of parametric polymorphism: the guarantee that
the function treats all types uniformly (which is also why it's easy to
reason about and test). If behavior must vary by type, say so honestly —
bounded types (`<T extends Priceable>`), separate overloads, or subtype
dispatch.

## Key takeaways

- Polymorphism is three tools: subtype (runtime behavior), parametric
  (type-uniform data handling), ad-hoc (compile-time overloads).
- Overloads resolve on **compile-time argument types**; overrides on the
  **runtime receiver type**. Variables typed as a superclass select the
  superclass overload.
- Open set of variants → virtual dispatch. Closed set → sealed types +
  exhaustive switch. That's the expression problem, and it's a trade-off, not
  a rule.
- A generic that does `instanceof` on its type parameter isn't generic —
  make the type requirement explicit instead.
