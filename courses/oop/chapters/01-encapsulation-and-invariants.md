---
id: oop-01
title: Encapsulation and Invariants
minutes: 15
level: senior
---

Most developers learn encapsulation as "make fields private, add getters and
setters" — and then spend a decade writing objects that are encapsulated in
name only. At senior level, encapsulation is not about hiding *data*; it is
about protecting *invariants*: the rules that must always be true for an
object to be valid. Once you see it that way, half of "clean code" advice
collapses into one principle.

## An invariant is a promise

An invariant is a condition that holds for every publicly observable state of
an object. Examples:

- An `Order`'s `total` always equals the sum of its line items.
- A `DateRange`'s `start` is never after its `end`.
- A `BankAccount`'s balance never goes below its overdraft limit.

The whole point of a class — the *actual* point — is to give those rules one
enforced home. If code anywhere else can break the rule, the class has failed
at its only job.

```java
// Encapsulated in name only
public class DateRange {
    private LocalDate start;
    private LocalDate end;

    public LocalDate getStart() { return start; }
    public void setStart(LocalDate s) { this.start = s; }
    public LocalDate getEnd() { return end; }
    public void setEnd(LocalDate e) { this.end = e; }
}
```

Every field is private, yet nothing is protected: any caller can set
`start` after `end`. The getters/setters are just `public` fields with extra
steps. Compare:

```java
public class DateRange {
    private final LocalDate start;
    private final LocalDate end;

    public DateRange(LocalDate start, LocalDate end) {
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("start must be <= end");
        }
        this.start = start;
        this.end = end;
    }

    public boolean overlaps(DateRange other) {
        return !start.isAfter(other.end) && !other.start.isAfter(end);
    }
}
```

The invariant is checked once, at the only gate through which state can be
created. Every other method can now *assume* validity instead of re-checking
it — that assumption is what makes the rest of the codebase simpler.

> **Interview lens:** "What's wrong with getters and setters?" is a classic
> senior screen. The weak answer is "they expose internals." The strong answer
> is: *setters let callers put the object into invalid intermediate states,
> which moves invariant enforcement from one constructor to every call site.*

## Tell, Don't Ask

A reliable smell that invariants live in the wrong place: code that *asks* an
object for data, computes a decision outside it, then writes state back.

```java
// Ask (invariant enforced at the call site — i.e., everywhere)
if (account.getBalance() - amount >= account.getOverdraftLimit()) {
    account.setBalance(account.getBalance() - amount);
}

// Tell (invariant enforced inside — once)
account.withdraw(amount); // throws InsufficientFundsException if invalid
```

The first version isn't just verbose — it's a race condition in concurrent
code, and it silently breaks the moment a second call site forgets the check.
"Tell, Don't Ask" is invariant-thinking applied to method design: move the
decision to where the data lives.

> **Trade-off:** Tell-Don't-Ask taken to an extreme produces god objects that
> absorb every behavior touching their data. The boundary: an object should
> own decisions that protect *its own invariants*; orchestration across
> several objects belongs in a service or domain operation. Knowing where that
> line sits is precisely the senior-level judgment call.

## Leaking state through references

Invariants can be bypassed without a single setter:

```java
public class Order {
    private final List<LineItem> items = new ArrayList<>();

    public List<LineItem> getItems() { return items; } // leak!
    public Money getTotal() { /* cached sum */ }
}

order.getItems().clear(); // total is now a lie; no setter involved
```

Returning a mutable internal collection hands every caller a remote control
for your private state. Defenses, in order of preference:

1. **Don't expose the collection** — expose the queries callers actually need
   (`itemCount()`, `contains(sku)`).
2. **Return an unmodifiable view** (`List.copyOf(items)` or
   `Collections.unmodifiableList`).
3. **Return a defensive copy** when callers legitimately need a snapshot.

The same applies to mutable parameters coming *in*: a constructor that stores
a caller-owned `List` shares its invariants with whoever kept that reference.

## Encapsulation at the module level

The unit of encapsulation grows with the system: class → package/module →
service. The question stays identical at every scale: *"if this rule changed,
how many places would I have to edit?"* A microservice that lets other
services read its database tables has the same disease as the `DateRange`
with setters — the invariant has no single enforced home. Senior engineers
recognize it as one problem, not three.

## Key takeaways

- Encapsulation protects **invariants**, not fields. Private fields with
  public setters protect nothing.
- Validate at the **gate** (constructor / mutating methods), so all other code
  can assume validity instead of re-checking it.
- **Tell, Don't Ask**: decisions that protect an object's invariants belong
  inside the object; cross-object orchestration does not.
- Returning mutable internals (or storing caller-owned mutables) leaks state
  as surely as a setter does.
- The principle scales: class, module, and service boundaries all fail the
  same way — when a rule has more than one enforced home.
