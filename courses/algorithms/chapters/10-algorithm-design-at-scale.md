---
id: algo-10
title: Algorithm Design at Scale
minutes: 17
level: staff
---

Nine chapters have each given you a technique that produces an exact,
optimal answer, in the class of problems where an exact, optimal answer
is reachable in reasonable time. This capstone is about the boundary of
that class — recognizing when you've left it, and what a competent
engineer does next, because "keep trying to find the polynomial
algorithm" is not a plan when one has been proven not to exist.

## P, NP, and NP-hard — precisely, this time

Chapter 1 introduced these informally; here's the precise version, because
the distinction matters for what you do next:

- **P**: problems solvable in polynomial time.
- **NP**: problems whose solution, if given, can be *verified* in
  polynomial time — even if *finding* it might take much longer. (Every
  problem in P is also in NP: if you can solve it fast, you can certainly
  verify a given answer fast.)
- **NP-complete**: the hardest problems *in* NP — if any one of them had a
  polynomial solution, every problem in NP would too (they're all
  polynomially reducible to each other).
- **NP-hard**: at least as hard as NP-complete problems, but not
  necessarily in NP themselves (may not even have polynomial-time
  *verification* — some NP-hard optimization problems are like this).

Whether P = NP is unresolved — one of the Clay Millennium Prize problems,
unsolved since being posed decades ago. The practical, working assumption
essentially every engineer operates under: **P ≠ NP**, meaning NP-complete
and NP-hard problems have no known polynomial algorithm, and finding one
would be one of the most significant results in the field's history.

## Recognizing NP-hardness in a disguised problem

NP-hard problems rarely arrive labeled. They arrive as "optimize this
delivery route," "schedule these jobs to minimize total completion time
under these constraints," "partition this workload evenly across
machines" — practical asks that turn out to be Traveling Salesman, job-
shop scheduling, or partition problems in disguise. The recognition skill:

- **Combinatorial explosion in the naive solution space** — if the only
  correct brute-force approach is "try every ordering/subset/assignment,"
  suspect NP-hardness before assuming a clever polynomial algorithm is
  waiting to be found.
- **Resemblance to a known NP-hard problem's shape** — "visit every
  location exactly once, minimize total cost" is TSP; "select a subset
  meeting a target under constraints" is subset-sum/knapsack-shaped;
  "assign items to bins without exceeding capacity" is bin-packing.
- **A history of the problem resisting polynomial solutions** — if
  the general form has been studied for decades with no known efficient
  algorithm, that's itself informative, even without a formal reduction.

> **Interview lens:** Correctly saying "I believe this is NP-hard, here's
> why it resembles [known problem]" — even without a rigorous reduction
> proof on the spot — is a stronger answer than confidently producing a
> polynomial "solution" that's actually just wrong on adversarial input.
> Staff-level interviews specifically probe for this recognition.

## What to do once you've recognized NP-hardness

Recognizing the class changes the goal from "find the optimal polynomial
algorithm" (not available) to one of several legitimate alternatives:

1. **Approximation algorithms** — provably within some bound of optimal
   (e.g., "always within 2x of the true minimum"), often running in
   polynomial time. For NP-hard problems with known approximation
   algorithms, this is frequently the right engineering answer: a
   provable *bound* on how far from optimal you are, computed fast.
2. **Heuristics** — no provable bound, but good performance in practice
   on realistic inputs (simulated annealing, genetic algorithms, greedy
   heuristics with local search refinement). Weaker guarantee than
   approximation algorithms, but often simpler and effective for the
   actual data distribution a system sees.
3. **Exact algorithms on restricted inputs** — the general problem is
   NP-hard, but your actual instance might have exploitable structure
   (small n, bounded treewidth, near-planarity) that makes exact
   bitmask-DP (chapter 9) or backtracking-with-strong-pruning (chapter 8)
   fast enough in practice, even without a general polynomial guarantee.
4. **Reformulate the actual business requirement.** Often "find the
   provably optimal route" was never the real requirement — "find a good
   route, fast, that a human would sign off on" is a different, more
   tractable problem. This is a legitimate engineering move, not giving
   up: solving the right problem approximately beats solving the wrong
   (over-specified) problem exactly.

> **Trade-off:** Choosing among these isn't about which is "best" in the
> abstract — it's about what the actual system needs: a hard correctness/
> latency SLA favors a proven-bound approximation algorithm; an offline
> batch job with generous time budget can afford a slower but near-optimal
> heuristic; genuinely small, bounded inputs might not need approximation
> at all if exact bitmask DP is fast enough.

## A worked recognition: delivery route optimization

"Optimize delivery routes for 50 trucks across 10,000 stops daily,
minimizing total distance, updated in real time as new orders arrive."
Walking through this using the DSA course's capstone framework (chapter
10 of that course) plus this chapter's:

1. **Recognize the shape**: multi-vehicle routing with real-time updates
   is a variant of TSP (NP-hard) times multiple vehicles times a dynamic
   constraint — strictly harder than single-TSP, not easier.
2. **Rule out exact solutions**: 10,000 stops makes even bitmask DP
   (2^10000) absurd — this is nowhere near the "small bounded n" case
   where exact methods remain viable.
3. **Choose the approach**: real-time updates rule out slow heuristics
   that need to fully re-solve from scratch; a common real answer is a
   fast heuristic construction (nearest-neighbor or greedy insertion) plus
   local-search refinement (2-opt swaps) run incrementally as new orders
   arrive — no optimality guarantee, but bounded, predictable latency and
   good-enough routes in practice.
4. **Match the failure cost**: a suboptimal route costs some extra fuel
   and time — a real but survivable cost, not a correctness catastrophe —
   which is exactly the kind of cost profile that justifies heuristics
   over provably-bounded approximation algorithms (which would cost more
   engineering effort for a guarantee this system doesn't strictly need).

This is the capstone's actual point: recognizing the problem class is
step one; matching the *response* to the actual constraints (latency,
failure cost, input size) — the same discipline as every prior "choosing
under real constraints" chapter in this course and the DSA course — is
what turns "this is NP-hard" from a dead end into a design decision.

## Key takeaways

- P (solvable fast), NP (verifiable fast), NP-complete (hardest problems
  in NP, mutually reducible), NP-hard (at least as hard, not necessarily
  in NP) — P vs NP is unresolved, and NP-hard/NP-complete problems have
  no known polynomial algorithm.
- Recognize NP-hardness by shape: combinatorial "try every
  ordering/subset/assignment" naive solutions, resemblance to TSP/
  knapsack/bin-packing, or a problem's long history resisting efficient
  solutions.
- Once recognized, the response isn't "keep searching for polynomial" —
  it's approximation algorithms (provable bound), heuristics (no bound,
  good in practice), exact methods on restricted/small instances, or
  reformulating the actual business requirement.
- Choosing among these is constraint-driven, not abstract: latency SLAs,
  failure cost, and actual input size determine which response fits — the
  same decision-framework discipline this course and the DSA course have
  built throughout.
- Recognizing a problem is NP-hard, even informally, is a stronger signal
  of understanding than confidently presenting a polynomial "solution"
  that's actually wrong on some input — staff-level judgment is knowing
  which situation you're in.
