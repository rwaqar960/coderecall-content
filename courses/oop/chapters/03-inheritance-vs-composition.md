---
id: oop-03
title: Inheritance vs Composition
minutes: 15
level: senior
---

"Favor composition over inheritance" is the most quoted and least understood
line in OO design. Quoted, because inheritance has burned everyone. Least
understood, because the interesting question isn't *which is better* — it's
*what inheritance actually costs, and when that cost is worth paying.*

## What inheritance really couples you to

`class B extends A` buys reuse, but the price is the strongest coupling the
language offers:

1. **Implementation coupling.** B depends not just on A's interface but on
   its *self-usage pattern* — which methods call which. That's undocumented
   and can change in any release.
2. **The fragile base class problem.** A can break B without touching any
   line B overrides.

The classic demonstration:

```java
class CountingSet<T> extends HashSet<T> {
    private int adds = 0;

    @Override public boolean add(T t) { adds++; return super.add(t); }

    @Override public boolean addAll(Collection<? extends T> c) {
        adds += c.size();
        return super.addAll(c);   // HashSet.addAll calls add() internally...
    }                              // ...every element is counted twice
}
```

The bug isn't in either method — it's in an assumption about the base class's
internals. If a future JDK changed `addAll` to *not* call `add`, the bug
would silently invert. You cannot write `CountingSet` correctly without
knowing (and freezing) `HashSet`'s private call graph.

The composition version has no such dependency:

```java
class CountingSet<T> {
    private final Set<T> inner = new HashSet<>();
    private int adds = 0;

    boolean add(T t) { adds++; return inner.add(t); }
    boolean addAll(Collection<? extends T> c) {
        int before = inner.size();
        boolean changed = inner.addAll(c);
        adds += inner.size() - before;
        return changed;
    }
}
```

It depends only on `Set`'s public contract. That is the entire argument for
composition, compressed: **inherit and you couple to implementation; compose
and you couple to interface.**

> **Interview lens:** If asked to justify "composition over inheritance,"
> reciting the slogan scores zero. Walking through the fragile-base-class
> mechanism — self-calls, `addAll`/`add` — is what demonstrates seniority.

## Is-a is not enough

The usual test — "use inheritance when B *is-a* A" — is too weak. A square
"is-a" rectangle in geometry, yet `Square extends Rectangle` is the textbook
Liskov violation (next chapter). The stronger test has three parts:

1. **Substitutability** — can B be used *everywhere* A is, honoring all of
   A's contracts, forever?
2. **You control A**, or A was explicitly *designed* for extension
   (documented self-use, protected hooks, stable contracts).
3. The relationship is **permanent** — a `Manager extends Employee` design
   breaks the day someone is both, or changes role.

If any answer is "no," compose. Notice how rarely all three are "yes" for
classes you don't own — which is why "don't extend classes you don't
control" is a decent one-line policy, and why Effective Java says *design
and document for inheritance or else prohibit it* (make classes `final` by
default).

## What composition costs

Honesty requires the other column. Composition brings:

- **Forwarding boilerplate** — the wrapper must re-expose what it delegates
  (Kotlin's `by`, Delphi-style delegation, or codegen mitigate this; Java
  makes you type it).
- **Identity split** — the wrapper is not an instance of the wrapped type;
  it breaks `instanceof`, and the *self problem* means the inner object's
  self-calls never reach the wrapper's overrides. Observer-style callbacks
  registered by the inner object expose the inner, not the wrapper.
- **One more object** in every diagram and stack trace.

> **Trade-off:** Inheritance is a specialized tool that's *excellent* in its
> niche: closed, designed-for-extension hierarchies you control — abstract
> template classes with documented hook methods, framework base classes
> (`StatefulWidget`, `HttpServlet`) whose entire purpose is subclassing.
> The failure mode is using it as a general code-reuse mechanism.

## The middle path: interfaces + composition

Most "I need inheritance" cases decompose into two separate needs:
**polymorphism** (satisfied by implementing an interface) and **reuse**
(satisfied by delegating to a shared component). Splitting them keeps both
cheap:

```java
class AuditedRepository implements Repository {   // polymorphism
    private final Repository inner;               // reuse
    private final AuditLog log;

    public Entity save(Entity e) {
        log.record("save", e.id());
        return inner.save(e);
    }
}
```

This is the Decorator pattern, and it's what "favor composition" looks like
in practice: the type system still sees a `Repository`; nothing is coupled to
anyone's private call graph; auditing stacks freely with caching, retries,
metrics.

## Key takeaways

- Inheritance couples you to a base class's **implementation and self-usage
  pattern**; composition couples you only to a **public contract**.
- The fragile base class problem is concrete: overriding methods that the
  base also calls internally (`addAll` → `add`) double-counts, skips, or
  breaks silently when the base evolves.
- "Is-a" is insufficient. Require substitutability + a base designed for
  extension + a permanent relationship — or compose.
- Composition's real costs: forwarding boilerplate, `instanceof`/identity
  loss, and the self problem. Know them before quoting the slogan.
- Interface for the *type*, delegation for the *reuse* — the decorator shape
  solves most cases inheritance is misused for.
