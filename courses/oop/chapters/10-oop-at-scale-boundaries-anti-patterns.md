---
id: oop-10
title: "OOP at Scale: Boundaries and Anti-Patterns"
minutes: 17
level: staff
---

The previous nine chapters give you the principles. This one is about what
happens when 40 engineers apply them to 400k lines for four years — where
object-oriented design succeeds or fails at the *system* level, and the
anti-patterns that emerge not from ignorance but from drift.

## The anemic domain model

The most common large-codebase disease: entities reduced to field bags,
with all behavior extracted into services.

```java
class Order { /* getters and setters only */ }

class OrderService {
    void addItem(Order order, LineItem item) {
        if (order.getStatus() == SUBMITTED) throw new IllegalStateException();
        order.getItems().add(item);
        order.setTotal(order.getTotal().plus(item.price()));
    }
}
```

Recognize it? It's chapter 1's ask-don't-tell, industrialized. Every
invariant ("submitted orders don't change," "total equals sum of items")
is enforced *in the service* — meaning in *every* service that touches
orders, meaning eventually in none of them. The model claims to be OO but
is procedural code operating on records.

The treatment isn't "move everything into the entity" (that's the god
object, the opposite failure). It's chapter 1's line: **invariants about an
order's own consistency live in `Order`; orchestration across aggregates —
payment, inventory, notification — lives in services.** Both layers exist;
each owns what it can actually protect.

> **Interview lens:** "Where do you put business logic — entities or
> services?" is a false dichotomy probe. The senior answer draws the line:
> self-consistency inside the object, cross-object workflows in domain
> services, and names the anemic-model failure that motivates the question.

## Aggregates: consistency needs a boundary

At scale, "protect your invariants" needs a scope. An **aggregate** (from
DDD) is a cluster of objects — `Order` and its `LineItem`s — that must be
consistent *together*, with one root through which all changes flow. Rules
that keep systems sane:

- Outside code holds references only to the **root** (`Order`), never to
  internals (`LineItem`) — chapter 1's leak rule, scaled up.
- One transaction = one aggregate. Cross-aggregate rules ("customer credit
  limit across all orders") are *eventually* consistent, by design — trying
  to make them transactional couples aggregates back together.
- Aggregates reference each other by **ID**, not object reference. This is
  what keeps the object graph from becoming one giant ball where loading a
  customer drags half the database into memory.

Aggregate boundaries are also candidate *service* boundaries (chapter 8):
they're where the object model already declared "consistency ends here."

## God objects, and how they actually form

Nobody designs a 6,000-line `OrderManager`. It forms by gravity: every
sprint, the class that already touches orders is the *cheapest place* to add
one more order-related thing. Each addition is locally rational; the sum is
a class that answers to every actor (SRP's failure), self-couples internally
(fragile to change), and monopolizes merge traffic.

Two structural defenses work better than review vigilance:

- **Size/ownership tripwires** — modules over a threshold, or edited by
  more than N teams a quarter, get flagged for splitting along actor lines.
- **New capability = new module by default.** Force the argument for
  *joining* an existing class rather than for creating a new one.

The same gravity acts on `utils`, `common`, and `shared` — chapter 8's
cohesion bug. Anything named "misc" grows until it couples everything.

## Boundaries beat objects

The uncomfortable staff-level truth: at system scale, **the boundaries
matter more than the objects inside them.** A service with a crisp,
narrow, stable API (facade + adapters + owned contracts) whose internals
are mediocre procedural code will age *better* than beautifully crafted
objects leaking across a sloppy boundary. Every prior chapter converges
here:

- Encapsulation (1) and aggregates (10): one enforced home per rule.
- LSP (4) and ISP (6): contracts callers can trust, sized to real clients.
- DIP (6) and dependency direction (8): volatile edges depend on stable
  cores, never the reverse.
- OCP (5): boundaries are where extension points pay for themselves.

Inside a well-drawn boundary, imperfection is contained and refactorable.
Across a bad boundary, even perfect objects metastasize.

> **Trade-off:** Strong boundaries cost duplication. Two services may each
> keep their own `Money`, their own `CustomerId`, near-identical DTOs — and
> that's usually *correct*: sharing a domain-model library across service
> boundaries recouples deployments (the distributed monolith returns through
> the package manager). Duplicate the stable little things; share nothing
> volatile.

## An OOP-at-scale review checklist

1. Can this rule be broken from outside the module that owns it?
   *(encapsulation/aggregate leak)*
2. Which **actor** asks for changes here? More than one? *(SRP)*
3. Could a substitute implementation honor this contract? Do the tests
   prove it? *(LSP)*
4. Does the caller depend on more than it uses? *(ISP)*
5. Do arrows point from volatile to stable? Any cycles? *(DIP, ch. 8)*
6. Is this abstraction backed by ≥2 real variations? *(OCP economy)*
7. Is mutation confined behind a gate, values immutable? *(ch. 1, 7)*
8. Would this change land as *addition* or as *surgery across files*?

Eight questions, one theme: **change should have a small, known blast
radius.** That's what object-oriented design is *for* — the objects were
never the point.

## Key takeaways

- Anemic models industrialize ask-don't-tell: invariants enforced in every
  service are enforced in none. Self-consistency in the entity;
  orchestration in services.
- Aggregates give invariants a scope: one root, one transaction, references
  by ID across boundaries, eventual consistency between aggregates.
- God objects and `utils` form by gravity, not intent — counter them
  structurally (tripwires, new-module-by-default), not by vigilance.
- At scale, boundary quality dominates object quality. Duplicating small
  stable types across boundaries usually beats sharing them.
- Every OO principle is blast-radius management. Review for the eight
  questions, not for pattern compliance.
