---
id: oop-04
title: Liskov and Behavioral Subtyping
minutes: 16
level: senior
---

Every developer can recite the Liskov Substitution Principle: "subtypes must
be substitutable for their base types." Almost nobody can say what
*substitutable* means precisely — which is unfortunate, because the precise
version is a practical code-review checklist, not a philosophy.

## The real definition: contracts, not signatures

The compiler already enforces *signature* compatibility. LSP is about
**behavior**: a subtype must honor the base type's *contract* — the
promises callers are entitled to rely on. Formally (Liskov & Wing):

- **Preconditions may not be strengthened.** If `A.process(x)` accepts any
  non-null x, `B.process` can't reject odd numbers. B may *weaken* — accept
  more than A promised to.
- **Postconditions may not be weakened.** If A promises the result is
  sorted, B must deliver at least that. B may *strengthen* — promise more.
- **Invariants must be preserved.** Whatever always holds for A must keep
  holding for B.
- **History rule:** B may not introduce state changes that A's contract
  rules out — the classic: if A is immutable, a mutable B is not a subtype,
  even with identical signatures.

The slogan version for code review: *require no more, promise no less.*

## Square/Rectangle, properly diagnosed

```java
class Rectangle {
    void setWidth(int w)  { this.w = w; }
    void setHeight(int h) { this.h = h; }
    int area() { return w * h; }
}

class Square extends Rectangle {
    @Override void setWidth(int w)  { this.w = w; this.h = w; }
    @Override void setHeight(int h) { this.w = h; this.h = h; }
}
```

The violated promise is implicit but real: after `setWidth(5)`, the height is
unchanged. Client code legitimately depends on it:

```java
void stretch(Rectangle r) {
    r.setHeight(2);
    r.setWidth(10);
    assert r.area() == 20;  // Square: 100
}
```

Two senior-level lessons hide here. First, the violation lives in the
*mutators* — an immutable `Square`/`Rectangle` pair with `withWidth(...)`
returning a new value has no LSP problem (or make Square just *construct* a
Rectangle: a factory relationship, not a subtype one). Second, the contract
that broke was **never written down** — it existed in callers' reasonable
expectations. LSP forces you to treat those expectations as API.

> **Interview lens:** "Is Square a Rectangle?" The senior answer: "As
> immutable values, yes. As mutable objects, no — independent width/height
> mutation is part of Rectangle's contract, and Square can't honor it."
> That one sentence covers contracts, mutability, and modeling.

## Violations you've actually shipped

The textbook example is geometric; the production ones look like this:

- **Throwing `UnsupportedOperationException`** for an inherited method — a
  read-only collection behind a mutable `List` interface. (Java's own
  `Arrays.asList` fails LSP this way; it's why `List.copyOf` exists.)
- **Returning null** where the base always returned a value —
  postcondition weakened.
- **A subclass that requires setup** the base didn't ("call `init()` before
  `save()`") — precondition strengthened.
- **Overriding to do nothing** — a `NoOpCache` is usually fine (it honors
  "may evict anytime"), but a no-op `AuditLogger` where the base contract
  says "records are durable" is a silent compliance hole.
- **Tightened thread-safety expectations** — base documented as
  thread-safe, override isn't. Invariant broken; the failures arrive months
  later, in production, unattributed.

Note what these share: the compiler is perfectly happy with all of them.

> **Trade-off:** Strict LSP pushes toward *narrow, honest interfaces* —
> if half your implementations throw `UnsupportedOperationException`, the
> interface is too wide (foreshadowing ISP, chapter 6). But splitting every
> capability into its own micro-interface has its own cost in ceremony.
> The balance point: split along the lines where real implementations
> actually differ.

## LSP for exceptions and types

Two mechanical rules worth memorizing because reviewers miss them:

- Overrides may throw **narrower** exception types, never broader ones
  (Java enforces this for checked exceptions only — unchecked ones are on
  you and your code review).
- Return types may be **covariant** (narrower); parameters would need to be
  **contravariant** (wider) — most languages simply require invariant
  parameters in overrides, which is why "weakening preconditions" happens in
  *behavior*, not signatures.

## Key takeaways

- LSP = behavioral subtyping: **require no more (preconditions), promise no
  less (postconditions), preserve invariants and history.**
- Contracts include *unwritten but reasonable* caller expectations —
  Square/Rectangle breaks a promise no one ever typed.
- Mutability is often the deciding factor: immutable Square/Rectangle is
  fine; mutable is not.
- Real-world violations: `UnsupportedOperationException` implementations,
  null returns, mandatory-setup subclasses, silent no-ops, weakened
  thread-safety.
- If implementations keep needing to reject inherited operations, fix the
  interface, not the subclass.
