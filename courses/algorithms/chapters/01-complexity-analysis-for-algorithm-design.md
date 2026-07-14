---
id: algo-01
title: Complexity Analysis for Algorithm Design
minutes: 16
level: senior
---

The DSA course used Big-O as a lens for judging structures already built.
This course uses it as a *design tool* — before you write an algorithm, the
recurrence relation of its recursive calls tells you its complexity, often
before a single test runs. That predictive use is the senior-level skill
this chapter builds.

## Recurrence relations: complexity before you run anything

A recursive algorithm's time complexity is fully described by a
**recurrence relation** — an equation relating the cost of a problem of
size n to the cost of its recursive subproblems. Writing one down, before
implementing anything, tells you what you're building.

```
Binary search:    T(n) = T(n/2) + O(1)        → one subproblem, half size
Merge sort:       T(n) = 2T(n/2) + O(n)        → two subproblems, half size, O(n) merge
Naive Fibonacci:  T(n) = T(n-1) + T(n-2) + O(1) → two subproblems, barely smaller
```

The shape of the recurrence — how many subproblems, how much smaller, how
much non-recursive work per call — determines the growth rate entirely.
Naive Fibonacci's recurrence looks almost identical to merge sort's in
form, but "barely smaller" (n-1 instead of n/2) is the entire difference
between O(n) and O(2ⁿ). Recognizing that difference by inspection, not by
running the code, is what this chapter is for.

## The Master Theorem: solving recurrences by pattern

For recurrences of the form `T(n) = aT(n/b) + O(n^d)` (a subproblems, each
1/b the size, plus O(n^d) non-recursive work), the **Master theorem**
gives the answer directly by comparing `d` to `log_b(a)`:

- If d is less than log_b(a): the recursive calls dominate — `T(n) = O(n^(log_b a))`.
- If d equals log_b(a): balanced — `T(n) = O(n^d log n)`.
- If d is greater than log_b(a): the non-recursive work dominates — `T(n) = O(n^d)`.

Applied to merge sort: a=2, b=2, d=1. `log_2(2) = 1 = d` → the balanced
case → O(n log n), matching what every reference says, but now *derived*
rather than memorized. Applied to binary search: a=1, b=2, d=0.
`log_2(1) = 0 = d` → balanced case → O(n^0 log n) = O(log n).

> **Interview lens:** "Derive the time complexity of merge sort" separates
> candidates who memorized "O(n log n)" from those who can write the
> recurrence and apply the Master theorem — the second group can derive
> the complexity of an algorithm they've *never seen before*, which is the
> actual skill being tested.

## Why naive recursive Fibonacci is exponential — and what that costs

```java
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
```

This recurrence — `T(n) = T(n-1) + T(n-2) + O(1)` — doesn't fit the Master
theorem's form (subproblems aren't a fixed fraction of n), but its growth
is visible directly: each call spawns two more, each only trivially
smaller, so the call tree's node count roughly doubles per level down to
depth n. That's O(2ⁿ) calls — `fib(50)` alone is over a *quadrillion*
calls, which is why "just add memoization" (chapter 5) isn't an
optimization here, it's the difference between a program that returns
instantly and one that never finishes.

> **Trade-off:** The *shape* of a recurrence — not just its constants —
> determines whether an algorithm is viable at all past small inputs. This
> is the practical reason to write the recurrence down before coding: it's
> a five-minute check that catches an unusable design before you've built
> anything.

## Amortized vs. average-case: two different promises

The DSA course used amortized analysis for dynamic arrays and hash tables
(cost *averaged over a sequence of operations*, guaranteed regardless of
input). Algorithm design adds a distinct, often-confused sibling:
**average-case analysis** (cost averaged *over random inputs*, no
guarantee for a specific bad input).

- **Amortized**: quicksort's partition-swap bookkeeping is O(1) amortized
  per element — true for *any* input, because it's about operation cost,
  not data distribution.
- **Average-case**: quicksort's O(n log n) *overall* runtime is an
  average-case claim over random pivot choices — a specific adversarial
  input (already-sorted data with naive first-element pivoting) still
  produces O(n²), no averaging saves it.

Conflating these is a real interview and design mistake: "quicksort is
O(n log n)" is only true on average; its **worst case is O(n²)**, and that
worst case is reachable by realistic, not just adversarial, input (sorted
or reverse-sorted arrays, common in real pipelines processing already-
ordered data).

> **Interview lens:** "Is quicksort O(n log n)?" — the complete answer:
> "average-case yes, worst-case O(n²), and the worst case is triggered by
> already-sorted input with naive pivot selection — which is why production
> implementations randomize the pivot or use median-of-three."

## What "NP-hard" actually means, briefly

This course's capstone (chapter 10) covers this in depth, but the vocabulary
belongs here, next to complexity classes generally: **P** is problems
solvable in polynomial time; **NP** is problems whose solution can be
*verified* in polynomial time (not necessarily *found* that fast); **NP-hard**
problems are at least as hard as the hardest problems in NP — no known
polynomial algorithm solves them, and finding one would be one of the
biggest results in computer science history (whether P = NP is unresolved).

The practical, senior-level takeaway: recognizing that a problem you've
been asked to solve is NP-hard (traveling salesman, exact bin packing,
general graph coloring) changes the *goal* from "find the optimal
polynomial algorithm" (it doesn't exist, as far as anyone has proven) to
"find a good-enough approximation or heuristic" — chapter 10's territory.

## Key takeaways

- Write the recurrence relation before implementing — the *shape* (how
  many subproblems, how much smaller, how much work per call) reveals
  complexity, and viability, before any code runs.
- The Master theorem solves `T(n) = aT(n/b) + O(n^d)` recurrences directly
  by comparing d to log_b(a) — derive complexity instead of memorizing it.
- Naive recursive Fibonacci's O(2ⁿ) comes from subproblems that barely
  shrink (n-1, n-2) despite looking structurally similar to O(n log n)
  algorithms — the shape, not superficial resemblance, determines growth.
- Amortized analysis (cost per operation, any input) and average-case
  analysis (cost over random inputs) are different guarantees — quicksort's
  O(n log n) is average-case only; its O(n²) worst case is reachable by
  realistic (sorted) input, not just adversarial construction.
- NP-hard means no known polynomial algorithm exists — recognizing this
  changes the goal from "optimal" to "good enough," this course's capstone.
