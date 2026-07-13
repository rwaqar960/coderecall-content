---
id: oop-08
title: Coupling, Cohesion, and Dependency Direction
minutes: 16
level: staff
---

Every principle so far — encapsulation, LSP, SOLID — is a special case of two
older, deeper ideas: **minimize coupling, maximize cohesion**, and one that
took the industry decades longer to articulate: **point your dependencies
toward stability**. These are the concepts that scale from functions to
microservices, and they're what staff-level design discussions are actually
about.

## Coupling is a spectrum, not a boolean

"Loose coupling good" is useless in review; naming the *kind* of coupling is
what enables decisions. A working ladder, from worst to most benign:

1. **Content coupling** — reaching into another module's internals:
   reflection on private fields, another service's database tables
   (chapter 1's disease at scale).
2. **Common coupling** — shared global mutable state: singletons with
   setters, shared config objects everyone writes, `static` caches.
3. **Control coupling** — passing flags that select the callee's behavior:
   `render(data, /* isAdminMode */ true)`. The caller knows the callee's
   internals well enough to steer them.
4. **Stamp coupling** — passing a fat structure where a fragment is needed:
   handing the whole `HttpRequest` to a function that reads one header
   (ISP's smell, in coupling vocabulary).
5. **Data coupling** — passing exactly the values needed. The good default.
6. **Message coupling** — knowing only an endpoint/event name and a schema.
   Loosest, and priced accordingly: no compile-time checks, eventual
   consistency, observability burden.

Two review reflexes follow. First, most "refactor for decoupling" wins come
from moving *one step* down the ladder, not from jumping to events. Second,
coupling **counts both strength and visibility**: an explicit constructor
dependency is honest coupling — visible, compiler-checked; a hidden temporal
requirement ("call `init()` before `run()`") is weak-looking but far more
dangerous because nothing enforces it.

> **Interview lens:** "How would you decouple these services?" — the weak
> answer jumps to "message queue." The strong answer first names the current
> coupling kind, then argues the *minimum* step down the ladder that solves
> the actual problem, and prices what that step costs.

## Cohesion: the forgotten twin

Low coupling is easy if you don't care about cohesion — put everything in
one giant module; zero inter-module coupling! Cohesion is the counter-force:
**things that change together belong together.**

The practical test is not "do these methods share a topic" but "when a
requirement changes, how many modules must open?" A feature folder
containing its handler, validation, and persistence adapter is *cohesive*
even though it mixes technical layers; a `utils` package is the canonical
cohesion failure — a topic ("miscellaneous") rather than a change-axis.

This is also the honest framing of the microservices question: a service
boundary adds the *maximum* decoupling penalty (network, versioning,
eventual consistency), so it's only justified where cohesion analysis says
the two sides genuinely change independently — different teams, different
release cadences, different scaling. Splitting a cohesive domain across two
services buys distributed-system pain for negative gain; the industry's
"distributed monolith" is exactly this mistake.

## Dependency direction: depend on what's stable

Coupling tells you *how strongly* modules connect; direction tells you *who
suffers* when things change. The rule: **arrows should point from volatile
code toward stable code.**

- Depending on something stable (the standard library, a frozen protocol,
  your domain's core types) is cheap regardless of coupling strength.
- Depending on something volatile (an experimental service, this sprint's
  UI, a vendor SDK with quarterly breaking changes) is expensive even
  through a thin interface.

This is why DIP (chapter 6) works: the *interface owned by the policy* is a
stability point manufactured on purpose. It's also why "stable" must mean
*hard to change* in the social sense too — the more modules depend on X,
the more X must not change; so make heavily-depended-on things small and
abstract (interfaces, value types), and keep big concrete machinery at the
edges where nothing depends on it.

```
volatile ──────────────► stable
UI / adapters / vendors ──► use-cases ──► domain model
```

Cycles are the degenerate case: `A → B → A` means neither is stable, both
must be understood/deployed/tested together, and the "two modules" are one
module wearing two names. Break cycles by extracting the shared fragment
into a third module both depend on, or by inverting one arrow with an
interface + callback.

> **Trade-off:** Every decoupling mechanism — interface, event, queue,
> service boundary — adds indirection, latency, and a place for bugs to
> hide. Coupling is not a cost to minimize to zero; it's a *budget to spend
> where change is likely*. Two stable modules tightly coupled forever is
> often the correct design.

## Key takeaways

- Name the coupling kind (content → common → control → stamp → data →
  message); refactor **one step down**, not straight to events.
- Visible, compiler-checked coupling beats hidden temporal coupling of the
  same strength.
- Cohesion = things that change together live together. Optimize "modules
  opened per requirement," not topical purity. `utils` is a cohesion bug.
- Service boundaries maximize decoupling *cost* — only split where change
  axes genuinely diverge (teams, cadence, scale).
- Point arrows at stability; make heavily-depended-on things small and
  abstract; treat cycles as one module in denial.
