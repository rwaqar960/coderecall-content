---
id: kotlin-02
title: "Data Classes and copy(): Value Semantics Done Right"
minutes: 14
level: senior
---

The OOP course spent a full chapter arguing that value objects deserve
first-class language support — immutable, validated at construction,
equal by content. Kotlin's `data class` is that argument answered
directly by the language: one keyword generates exactly the boilerplate
that chapter existed to justify writing by hand. Knowing precisely what
it generates — and what it doesn't — is what separates using data classes
correctly from being surprised by them.

## What `data` actually generates

```kotlin
data class Money(val amount: BigDecimal, val currency: String)
```

One line generates: `equals()`/`hashCode()` based on all constructor
properties (content equality, not identity — chapter 2 of the DSA course's
entire equals/hashCode contract discussion, implemented correctly by
default), `toString()` (readable, not `Money@1a2b3c`), `copy()`
(construct a new instance with some properties changed), and `componentN()`
functions enabling destructuring. This is the OOP course's value-object
chapter's checklist, generated mechanically rather than hand-written and
prone to the classic mistakes (forgetting `hashCode()`, a stale
`toString()` after adding a field).

> **Interview lens:** "Why use a data class instead of a regular class
> with manually written equals/hashCode?" — the weak answer is "less
> code." The strong answer names the correctness risk being eliminated:
> hand-written equals/hashCode pairs drift out of sync when a property is
> added and one method is updated but not the other — a data class's
> generated pair can't drift, because both come from the same constructor
> property list, regenerated together.

## copy(): shallow, and why that's exactly correct

```kotlin
data class Order(val id: String, val items: List<Item>, val total: Money)

val updated = original.copy(total = newTotal)  // new Order, items list unchanged/shared
```

`copy()` performs a **shallow copy** — it creates a new instance with the
listed properties replaced and every other property carrying over the
*same reference* as the original. This is correct, not a limitation: for
genuinely immutable properties (an immutable `List`, another data class,
a value type), sharing the reference is free and completely safe — two
`Order` instances can share the same `items` list without either being
able to corrupt the other, precisely because neither can mutate it
(chapter 7 of the OOP course's immutability argument, made concrete).

The trap appears specifically when a data class holds a genuinely mutable
property:

```kotlin
data class Cart(val userId: String, val items: MutableList<Item>)

val cartCopy = original.copy()      // NEW Cart, but items is the SAME MutableList
cartCopy.items.add(extraItem)        // mutates original.items too — surprise
```

`copy()` didn't fail here — it did exactly what shallow copy means. The
actual bug is upstream: a `data class` holding a `MutableList` was already
a design mistake (the same mutable-reference-leak chapter 1 of the OOP
course names), and `copy()` just made the consequence visible sooner
rather than later.

> **Trade-off:** Deep-copying every `copy()` call by default would be
> "safer" in this one scenario and needlessly expensive in the overwhelming
> majority of others, where properties are already immutable. Kotlin's
> choice (shallow, fast, correct-for-immutable-properties) is right; the
> fix for the mutable-property trap is making the property immutable in
> the first place (`List` instead of `MutableList`), not asking `copy()`
> to compensate for a design choice made one line earlier.

## `equals()` for data classes: still bound by the contract

Data-class-generated `equals()`/`hashCode()` correctly implements the DSA
course's three-rule contract — but only for the properties actually
listed in the **primary constructor**. A property declared in the class
body (not the constructor) is excluded from generated equality:

```kotlin
data class Point(val x: Int, val y: Int) {
    var label: String = ""   // NOT in the primary constructor
}

val a = Point(1, 2).apply { label = "A" }
val b = Point(1, 2).apply { label = "B" }
a == b   // true — label is ignored by generated equals()
```

This is intentional and documented, not a bug — but it's a real surprise
if you don't know the rule, especially since `label` still participates
in `toString()`'s *default* behavior... actually it doesn't either
(generated `toString()` also only includes primary-constructor
properties) — both generated methods are scoped identically, consistently
excluding body-declared properties. Knowing this rule precisely is what
prevents debugging a "why are these unequal/equal" surprise by guessing.

## When *not* to reach for `data class`

- **Entities with identity** (chapter 7 of the OOP course's distinction):
  a `User` compared by database ID, not by field content, shouldn't be a
  `data class` — content-based `equals()` is actively wrong for identity
  types, since two users who happen to share every field value (a data
  entry error, a test fixture) would incorrectly compare equal.
- **Classes with meaningful inheritance hierarchies**: `data class`
  interacts awkwardly with subclassing (the generated `equals()` uses
  exact class checks, not `is` checks, so subclass instances rarely equal
  parent instances as most people intuitively expect) — sealed hierarchies
  (chapter 3) are the idiomatic Kotlin alternative when you need both
  data-class-like properties and a type hierarchy.

## Key takeaways

- `data class` generates `equals()`/`hashCode()` (content-based, correctly
  paired so they can't drift out of sync), `toString()`, `copy()`, and
  `componentN()` — mechanically implementing the value-object checklist,
  not a shortcut around it.
- `copy()` is a shallow copy — correct and cheap for immutable properties
  (safe to share references), a real trap only when a data class holds a
  mutable property, which was already a design mistake before `copy()`
  made it visible.
- Generated `equals()`/`hashCode()`/`toString()` only consider primary-
  constructor properties — properties declared in the class body are
  silently excluded from all three, consistently.
- Reach for `data class` for value objects; avoid it for entities with
  identity (content equality is wrong there) and be cautious with
  inheritance (exact-class-check equality surprises subclass comparisons)
  — sealed hierarchies are the idiomatic fix when both are needed.
