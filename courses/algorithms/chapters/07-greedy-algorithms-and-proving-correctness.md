---
id: algo-07
title: Greedy Algorithms and Proving Correctness
minutes: 15
level: senior
---

Greedy algorithms are seductive: make the locally best choice at each step,
never reconsider, done. They're also the algorithm family most likely to
produce a plausible-looking, confidently-wrong solution, because "seems
locally sensible" and "provably optimal" are different claims, and only
one of them is checked by watching the algorithm run correctly on your
test cases.

## What "greedy" actually means

A greedy algorithm builds a solution incrementally, at each step choosing
whatever looks best *right now*, and never revisiting that choice. This is
categorically different from DP (chapter 5), which considers multiple
options and lets optimal substructure combine them — greedy commits
immediately and hopes the local choice is also globally correct. When it
works, it's dramatically simpler and faster than DP for the same problem;
when it doesn't, it produces a wrong answer with no indication anything
went wrong.

## Interval scheduling: greedy that's provably correct

Given intervals (meetings, jobs) with start/end times, select the maximum
number that don't overlap. The greedy rule: **always pick the interval
that ends earliest** among remaining valid choices.

```java
int maxNonOverlapping(int[][] intervals) {
    Arrays.sort(intervals, Comparator.comparingInt(iv -> iv[1]));  // sort by end time
    int count = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] interval : intervals) {
        if (interval[0] >= lastEnd) {   // starts after the last chosen interval ends
            count++;
            lastEnd = interval[1];
        }
    }
    return count;
}
```

This isn't just a heuristic that happens to work — it's provably optimal,
via the **exchange argument**: take any optimal solution; if it doesn't
pick the earliest-ending interval first, swap that first choice for the
earliest-ending one — the swap can only free up *more* room for subsequent
choices (since the earliest-ending interval, by definition, leaves at
least as much room as whatever else was chosen), never less. Repeating
this argument shows an optimal solution always exists that agrees with the
greedy choice at every step — which is exactly what "greedy is correct
here" means, proven rather than assumed.

> **Interview lens:** "Prove your greedy algorithm is correct" is asking
> for exactly this: an exchange argument (swapping the optimal solution's
> choice for the greedy choice never makes things worse) or a matching
> exchange-style argument. "It passed my test cases" is not a proof, and
> interviewers at this level know the difference.

## When greedy fails, and why it fails silently

**0/1 Knapsack** (chapter 6) is the canonical greedy failure. "Always take
the highest value-per-weight item that fits" seems locally sensible —
and produces a wrong answer on cases where taking a slightly-worse-ratio
item now leaves room for a much better combination later:

```
Capacity: 10
Item A: weight 6, value 10  (ratio 1.67)
Item B: weight 5, value 6   (ratio 1.2)
Item C: weight 5, value 6   (ratio 1.2)

Greedy (by ratio): take A (value 10), no room left for anything else. Total: 10.
Optimal: take B and C (weight 10, value 12). Total: 12.
```

Greedy commits to A immediately because it looks best *in isolation*, with
no mechanism to reconsider once B+C's combined value becomes visible.
This is exactly why 0/1 Knapsack needs DP (which considers both branches
via its recurrence) rather than greedy — **the local choice isn't
provably safe**, and no exchange argument can be constructed to show it
is, because it's actually false.

> **Trade-off:** The **fractional** knapsack variant (items can be split)
> *is* correctly solved by the same greedy ratio rule — because splitting
> removes the "all or nothing" commitment that makes the counter-example
> above work. This pairing (0/1 fails greedy, fractional succeeds) is the
> cleanest illustration in this course of how a small problem-constraint
> change flips the correct algorithm family entirely.

## Huffman coding: greedy at the system-design level

Huffman coding builds an optimal prefix-free binary encoding (no code is a
prefix of another, so encoded data is unambiguous) by greedily merging the
two least-frequent remaining symbols into a subtree, repeatedly, using a
min-heap (chapter 6 of the DSA course):

```java
// Sketch: repeatedly merge the two lowest-frequency nodes
PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.freq));
pq.addAll(initialNodes);
while (pq.size() > 1) {
    Node left = pq.poll(), right = pq.poll();
    pq.offer(new Node(left.freq + right.freq, left, right));
}
```

This greedy choice — merge the two smallest — is also provably optimal
(a different exchange argument: the two least-frequent symbols can always
be placed at maximum tree depth without loss), and it's the algorithm
underlying real compression formats (DEFLATE, used in gzip and PNG). This
is worth knowing not as trivia, but as a concrete answer to "when does
greedy actually get used in production": whenever a correctness proof for
it exists, which is the entire distinction this chapter is built around.

## The discipline: don't trust "it looks right"

Given a candidate greedy rule, the senior-level check is not "does it pass
my examples" — it's **can I construct an exchange argument, or can I
construct a counter-example?** Both are usually reachable in a few minutes
by hand, and doing this check *before* committing to greedy over DP is
what prevents shipping the knapsack-style silent failure.

> **Interview lens:** The strongest interview signal isn't proposing a
> greedy solution — it's proposing one, then immediately attempting to
> break it with a counter-example before presenting it as final. That
> self-skepticism is precisely the discipline this chapter is teaching.

## Key takeaways

- Greedy commits to the locally-best choice immediately, never
  reconsidering — dramatically simpler than DP when correct, silently
  wrong when not, with no runtime signal distinguishing the two cases.
- Interval scheduling's "earliest end time first" greedy rule is provably
  optimal via an exchange argument: swapping any optimal solution's first
  choice for the greedy choice never loses room for later choices.
- 0/1 Knapsack's greedy failure (highest value-per-weight first) is the
  canonical counter-example — a locally-best choice can foreclose a
  better combination, and no exchange argument can rescue it, because the
  claim is actually false.
- Fractional knapsack IS correctly greedy — removing the all-or-nothing
  constraint removes exactly the property that broke greedy for the 0/1
  version, illustrating how small constraint changes flip the right
  algorithm family.
- The discipline: before trusting a greedy rule, actively try to construct
  an exchange argument or a counter-example — "it passed my examples" is
  not a substitute for either.
