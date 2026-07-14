---
id: algo-04
title: Divide and Conquer
minutes: 15
level: senior
---

Merge sort is the textbook divide-and-conquer example, taught so early that
the *pattern* it demonstrates often gets lost behind the specific
algorithm. This chapter treats divide and conquer as a general design
strategy — three steps, applicable far beyond sorting — and uses it to
show how a problem's naive complexity can drop by an order of magnitude
once you recognize the shape.

## The three-step shape

Every divide-and-conquer algorithm follows the same structure:

1. **Divide** — split the problem into smaller subproblems of the same
   kind.
2. **Conquer** — solve each subproblem, recursively, until they're small
   enough to solve directly.
3. **Combine** — merge the subproblem solutions into a solution for the
   original problem.

Chapter 1's Master theorem is the tool for analyzing any algorithm with
this shape: the divide step determines `a` (how many subproblems) and `b`
(how much smaller), and the combine step determines the `O(n^d)` term.
Merge sort's combine step (merging two sorted halves) is O(n); that's the
entire reason it's O(n log n) rather than something else.

## Closest pair of points: from O(n²) to O(n log n)

Given n points in a plane, find the two closest together. The brute-force
approach checks every pair — O(n²). Divide and conquer restructures the
problem:

1. **Divide**: sort points by x-coordinate, split into left and right
   halves by a vertical line.
2. **Conquer**: recursively find the closest pair in each half.
3. **Combine**: the true closest pair is either entirely in one half
   (already found) *or* straddles the dividing line — and the clever part
   is bounding how many points near the line actually need checking: only
   points within the current best distance `d` of the line can possibly
   form a closer pair, and a geometric argument shows at most a small
   constant number of such points need comparing per point, making the
   combine step O(n) instead of the O(n²) a naive "check every pair near
   the line" would cost.

This gives `T(n) = 2T(n/2) + O(n)` — the exact merge-sort recurrence —
yielding O(n log n), a genuine asymptotic win over brute force for a
problem that doesn't superficially resemble sorting at all.

> **Interview lens:** The recognizable divide-and-conquer signal isn't
> "this problem involves an array" — it's "the answer to the whole problem
> can be assembled from the answers to independent halves, plus some
> bounded extra work to handle what crosses the boundary." Closest-pair's
> boundary case (points near the dividing line) is that extra work,
> explicitly.

## Quickselect: divide and conquer without conquering both halves

Finding the k-th smallest element doesn't require fully sorting — a
divide-and-conquer variant, **quickselect**, partitions around a pivot
(exactly like quicksort) but **only recurses into the half containing the
k-th element**, discarding the other half entirely:

```java
int quickselect(int[] arr, int lo, int hi, int k) {
    if (lo == hi) return arr[lo];
    int pivotIndex = partition(arr, lo, hi);   // same partition as quicksort
    if (k == pivotIndex) return arr[k];
    else if (k < pivotIndex) return quickselect(arr, lo, pivotIndex - 1, k);
    else return quickselect(arr, pivotIndex + 1, hi, k);
}
```

Because only one subproblem is recursed into (not both, unlike quicksort),
the recurrence becomes `T(n) = T(n/2) + O(n)` on average — and solving
that recurrence (geometric series, dominated by the first term) gives
**O(n) average time**, not O(n log n). This is the practical reason
`quickselect`-based algorithms (median-of-medians, top-K selection without
a heap) beat "sort everything, then index" for problems that only need one
order statistic, not the full ordering.

> **Trade-off:** Quickselect's O(n) average case has the same O(n²) worst
> case as quicksort, for the same reason (adversarial pivot selection) —
> chapter 1's average-vs-worst-case distinction, again. Deterministic
> median-of-medians pivot selection guarantees O(n) worst case at the cost
> of a larger constant factor — the same "pay more per operation for a
> guarantee" trade this course keeps returning to.

## Recognizing when NOT to divide and conquer

Not every recursive-looking problem benefits from this shape. The
tell that divide-and-conquer is the *wrong* tool: when subproblems
**overlap** — the same subproblem gets solved repeatedly across different
branches of the recursion tree. Naive Fibonacci (chapter 1) is exactly
this: `fib(n-2)` is recomputed as part of both `fib(n-1)` and directly,
over and over. Divide and conquer's "combine independent subproblem
results" model assumes independence; when it's violated, the fix isn't a
cleverer combine step, it's **dynamic programming** (chapter 5) —
recognizing overlapping subproblems and caching results instead of
resolving them ambiguously as more divide-and-conquer recursion.

> **Interview lens:** "Is this a divide-and-conquer or a DP problem?" —
> the test is exactly this overlap question: do the recursive subproblems
> share work with each other? If yes, DP; if no (truly independent
> halves), divide and conquer. Getting this classification right up front
> saves the wrong recursion structure from being built and then fixed.

## Key takeaways

- Divide and conquer is divide → conquer (recurse) → combine; the Master
  theorem (chapter 1) analyzes any algorithm with this shape directly from
  the divide/combine costs.
- Closest-pair-of-points drops from O(n²) to O(n log n) via this pattern
  — the combine step's boundary-case bound (few points need checking near
  the dividing line) is what makes the O(n) combine cost possible.
- Quickselect recurses into only ONE subproblem (not both), giving
  `T(n) = T(n/2) + O(n)` and O(n) average time — genuinely faster than
  sorting when only one order statistic (e.g. the median, the k-th
  smallest) is needed.
- The tell that divide-and-conquer is the wrong tool: overlapping
  subproblems (the same smaller problem recomputed across branches) —
  that's dynamic programming's territory, not divide and conquer's.
