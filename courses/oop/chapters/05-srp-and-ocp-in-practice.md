---
id: oop-05
title: SRP and OCP in Practice
minutes: 15
level: senior
---

The first two SOLID letters are the most quoted and the most misapplied.
"Single responsibility" gets used to justify splitting anything into
anything, and "open/closed" sounds like it demands speculative abstraction
everywhere. Both principles are sharper — and more useful — than their
slogans.

## SRP: one reason to change, not one thing to do

The common misreading: "a class should do one thing," which taken literally
produces one-method classes and a codebase of confetti. Martin's actual
formulation: **a module should have one reason to change** — later refined
to *one actor*: a module should be responsible to exactly one group of
people who request changes.

```java
class Employee {
    Money calculatePay() { ... }     // finance defines these rules
    String reportHours() { ... }     // operations defines this format
    void save() { ... }              // the DBA team owns the schema
}
```

This class serves three actors. The failure mode isn't aesthetic: finance
asks for an overtime tweak, the shared `calculateHours()` helper changes,
and the operations report is silently wrong. Different actors, coupled
fates, plus permanent merge-conflict traffic on a hot file.

The test that actually works in review: **list the stakeholders who could
demand changes to this class. More than one? Split along that line.** Not
"does it do two things" — *who owns the reasons.*

> **Trade-off:** SRP has a cost curve. Splitting by actor removes conflict
> and coupling; splitting past that — by verb, by method count, by vague
> discomfort — adds indirection with no one asking for it. A `UserService`
> with twelve methods serving one product team may be perfectly SRP-clean;
> a three-method class serving finance *and* legal is not.

> **Interview lens:** "What's wrong with a God class?" — weak answer: "it's
> too big." Strong answer: "it's responsible to too many actors, so
> unrelated requirements couple through shared state and helpers, and every
> team's change risks every other team's behavior."

## OCP: open for extension, closed for modification

The principle sounds paradoxical until you name the mechanism: **new
behavior should arrive as new code, not as edits to working code** — and
the mechanism is an abstraction point (interface, sealed set, higher-order
function) placed where variation actually occurs.

```java
// Every new export format edits this method (and its tests, and its risk):
String export(Report r, String format) {
    return switch (format) {
        case "csv"  -> toCsv(r);
        case "json" -> toJson(r);
        // next sprint: "xml", then "pdf", then...
        default -> throw new IllegalArgumentException(format);
    };
}

// OCP: the set of formats is open; the orchestration is closed.
interface ReportExporter {
    String formatId();
    String export(Report r);
}
// New format = new class + one registration. Zero edits to shipped code.
```

The payoff is risk isolation: the CSV exporter that's been correct for two
years is untouched — not re-reviewed, not re-tested, not re-broken — when
PDF arrives.

## The senior question: *where* to put the abstraction

OCP taken as a global rule ("never modify anything") demands infinite
speculative interfaces — the plugin-architecture disease, where every class
hides behind a pointless `IThing`. The principle is only economical where
change actually recurs. So:

1. **First change of a kind: just modify.** Concrete, simple code wins.
2. **Second change of the same kind: you now have evidence.** Introduce the
   abstraction along the axis that actually varied. ("Fool me twice" — this
   is the same instinct as the rule of three for deduplication.)
3. **Known-volatile axes** (export formats, payment providers, pricing
   rules, notification channels) justify the abstraction up front —
   the "crystal ball" is just the product roadmap.

Abstracting on the wrong axis is worse than not abstracting: you pay the
indirection tax forever *and* still edit the core for every real change.

> **Trade-off:** OCP protects against modification risk by adding
> indirection risk — more types, dispatch that's harder to trace, and a
> registration mechanism that becomes its own bug surface. The break-even is
> roughly: will this axis change ≥2 more times? If not, a switch statement
> in one file is the *better* engineering.

## SRP and OCP are the same force

Both principles manage the blast radius of change. SRP partitions code so
that a change belongs to one owner; OCP shapes the partition so the change
lands as addition rather than surgery. When a sealed switch keeps forcing
edits across files, that's SRP pointing at a missing OCP abstraction. When
an interface has one implementation and no second in sight, that's OCP
overreach violating the simplicity SRP protects.

## Key takeaways

- SRP: **one actor per module**, not one method per class. Split along
  stakeholder lines, not verb counts.
- The God-class problem is *coupled reasons to change* (shared helpers,
  shared state, merge traffic) — size is only the symptom.
- OCP: new behavior as **new code** via an abstraction point placed where
  variation recurs. Payoff = shipped code stays untouched.
- Don't pre-abstract: modify on the first change, abstract on the second,
  pre-build only for roadmap-certain axes.
- Both principles are blast-radius management; use each to diagnose
  overuse of the other.
