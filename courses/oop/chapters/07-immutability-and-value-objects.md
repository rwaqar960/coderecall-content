---
id: oop-07
title: Immutability and Value Objects
minutes: 14
level: senior
---

Chapter 1 argued that encapsulation means protecting invariants. Immutability
is the logical extreme of that argument: an object whose invariants are
checked once, at construction, and can never be violated afterward — because
*nothing* can change. Understanding when that trade is worth it, and what a
value object is, separates code that merely works from code that's easy to
reason about.

## Identity vs value

Two kinds of objects live in every domain model, and confusing them causes
real bugs:

- **Entities** have *identity*: two `Customer` objects with identical fields
  are still different customers. They live over time, change state, and are
  compared by ID.
- **Value objects** are *their fields*: two `Money(5, "USD")` are the same
  money. No identity, no lifecycle — compared by content, and safely
  interchangeable.

The senior habit is spotting values hiding in primitives:

```java
// primitives pretending
void transfer(String fromIban, String toIban, BigDecimal amount, String currency)

// values, named
void transfer(Iban from, Iban to, Money amount)
```

This "primitive obsession" fix isn't cosmetic. `Iban` validates once in its
constructor (chapter 1's gate); the compiler now rejects
`transfer(amount, from, to)` argument swaps; and `Money` gives currency
arithmetic one home instead of forty call sites. Kotlin data classes, Java
records, and C# records exist precisely to make values cheap to declare:

```java
record Money(BigDecimal amount, Currency currency) {
    Money {                       // compact constructor = the gate
        if (amount.scale() > currency.getDefaultFractionDigits())
            throw new IllegalArgumentException("sub-unit precision");
    }
    Money plus(Money other) {
        requireSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }
}
```

## What immutability actually buys

- **Invariants checked once.** Valid at construction = valid forever. No
  temporal coupling, no "is it initialized yet?" states.
- **Free thread safety.** Immutable objects can be shared across threads
  with no locks, because data races need a writer.
- **Aliasing bugs vanish.** Chapter 1's leaked-collection disease exists
  only for mutable state; handing out an immutable object is always safe.
- **Sane hash keys.** A mutable object in a `HashSet` that changes after
  insertion is silently lost — its hash bucket is stale. Values as map
  keys are only safe *because* they're immutable.
- **equals/hashCode make sense.** Value semantics and mutation don't mix;
  records get equality right by construction.

> **Interview lens:** "Why must equals/hashCode fields never mutate while
> the object is in a HashSet?" — if you can explain the stale-bucket
> mechanism, you understand hashing *and* immutability in one answer.

## The costs, honestly

- **Allocation pressure.** Every "change" is a new object. For hot loops
  building large structures, that's real GC traffic — hence the builder
  escape hatch: mutable `StringBuilder` locally, immutable `String`
  published. Mutation confined to one stack frame is invisible to the rest
  of the program and costs nothing in reasoning.
- **Update ergonomics.** Changing one field three levels deep in nested
  immutable structures is painful without language help (`copyWith`,
  record `with`-patterns, lenses). Deep hierarchies of immutable data want
  language or library support; without it, teams quietly regress to setters.
- **Not everything is a value.** An entity that must be observed changing
  (an account balance, a session) can *contain* values and expose
  controlled mutation — immutability is a default for leaves, not a
  religion for the whole graph.

> **Trade-off:** The practical default that works: **values immutable
> always; entities mutable only through invariant-protecting methods
> (chapter 1); collections exposed as read-only views.** Reach for full
> persistent-data-structure architectures only when concurrency or
> undo/replay requirements pay for them.

## Immutability at the API boundary

Even mutable designs benefit from immutable *edges*:

```java
class Order {                       // entity, mutable inside
    private final List<LineItem> items = new ArrayList<>();

    void add(LineItem item) { ... }              // controlled mutation
    List<LineItem> items() { return List.copyOf(items); }  // immutable out
    Money total() { ... }
}
```

Callers get snapshots they can't corrupt; the entity keeps one writer —
itself. This is the practical synthesis of chapters 1 and 7: encapsulated
mutation inside, value semantics outside.

## Key takeaways

- Entities are compared by **identity** and may change; value objects *are*
  their fields — immutable, validated at construction, compared by content.
- Replacing primitive clusters (`String iban`, `BigDecimal + String
  currency`) with value types buys validation-once, argument-swap safety,
  and one home for domain arithmetic.
- Immutability = invariants checked once, free thread safety, no aliasing
  bugs, and hash keys that don't corrupt collections.
- Costs are real: allocation churn and nested-update ergonomics. Confine
  mutation locally (builders) instead of abandoning the model.
- Default: immutable values, controlled-mutation entities, read-only views
  at every boundary.
