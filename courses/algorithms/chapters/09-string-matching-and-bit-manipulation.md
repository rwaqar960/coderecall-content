---
id: algo-09
title: String Matching and Bit Manipulation
minutes: 15
level: senior
---

This chapter pairs two techniques that share a common thread: both exploit
structure that naive approaches throw away — string matching exploits
information from failed comparisons instead of discarding it, and bit
manipulation exploits the machine's native word-level parallelism to
represent and combine state far more compactly than an equivalent object-
based structure would.

## Naive string matching, and the information it wastes

Finding a pattern of length m in a text of length n, naively, checks every
starting position and compares character by character — O(nm) worst case.
The waste: when a mismatch occurs partway through a comparison, the naive
approach discards everything it learned from the partial match and starts
completely over at the next position.

```java
// Naive: O(nm) worst case
boolean naiveContains(String text, String pattern) {
    for (int i = 0; i <= text.length() - pattern.length(); i++) {
        int j = 0;
        while (j < pattern.length() && text.charAt(i + j) == pattern.charAt(j)) j++;
        if (j == pattern.length()) return true;
    }
    return false;
}
```

## KMP: reusing the partial match instead of discarding it

**Knuth-Morris-Pratt** precomputes a **failure function** for the pattern
— for each position, how much of a prefix-that's-also-a-suffix already
matched, so on a mismatch, the algorithm can skip ahead in the *pattern*
without ever re-examining characters of the *text* it already matched.
This achieves O(n + m) — genuinely linear, not just "faster in practice."

The core insight, stated precisely: if `pattern[0..j-1]` matched
`text[i-j..i-1]` and then mismatched at `pattern[j]`, and if some prefix
of `pattern[0..j-1]` is *also* a suffix of it, that prefix is guaranteed
to already match the corresponding text — so the algorithm resumes
comparison from there instead of restarting `i` from scratch. Building
this failure function is itself O(m), and the main scan is O(n),
totalling O(n + m) — the DSA course's Floyd's-algorithm lesson again:
tracking a small amount of extra structure (here, the failure function)
turns repeated redundant work into a single linear pass.

> **Interview lens:** "Why is KMP O(n + m) instead of O(nm)?" — the
> complete answer names the mechanism: the failure function lets the
> text pointer `i` **never move backward**, so the text is scanned at
> most once, while the pattern-side backtracking is bounded by the
> precomputed failure function, not by re-scanning text.

## Rabin-Karp: hashing as a filter, not a hasher's substitute for comparison

**Rabin-Karp** takes a different approach: compute a rolling hash of each
text window and compare hashes to the pattern's hash first, only doing a
full character comparison when hashes match (filtering out the vast
majority of non-matching positions cheaply). The **rolling** part is what
makes it fast — the hash of the next window is computed from the current
window's hash in O(1), not recomputed from scratch:

```
hash(text[i+1..i+m]) = (hash(text[i..i+m-1]) - text[i]*base^(m-1)) * base + text[i+m]
```

Average case is O(n + m), same as KMP — but worst case is O(nm) if
many **hash collisions** occur (different substrings, same hash), forcing
full comparisons anyway. This is a direct callback to the DSA course's
hashing chapter: a hash filter is only as good as its collision rate, and
an attacker (or unlucky data) who can force collisions defeats the whole
optimization, same mechanism as the hash-flooding risk discussed there.

> **Trade-off:** KMP guarantees O(n + m) unconditionally; Rabin-Karp is
> simpler to implement and generalizes elegantly to **multi-pattern**
> search (hash all patterns, check each window's hash against the set),
> but carries real worst-case risk from collisions. Choosing between them
> is, again, a guarantee-vs-simplicity trade-off, not a strict ranking.

## Bit manipulation: the machine's native SIMD

Integers are, at the hardware level, already parallel bit arrays — a
32-bit int performs 32 boolean operations in a single AND/OR/XOR
instruction. This makes bitwise operations the fastest possible way to
represent and manipulate small, fixed-size sets:

- **`n & (n-1)`** clears the lowest set bit — used to count set bits, or
  check if `n` is a power of two (`n & (n-1) == 0` for exactly one bit set).
- **`n & -n`** isolates the lowest set bit — useful in Fenwick trees (a
  compact structure for prefix-sum queries, built entirely on this trick).
- **XOR's self-canceling property** (`x ^ x = 0`, `x ^ 0 = x`) solves
  "find the single non-duplicated element in an array where every other
  element appears twice" in O(n) time and O(1) space — XOR everything
  together, and every paired value cancels, leaving only the unpaired one.

## Bitmasking as DP state: chapter 6's forward reference, resolved

Chapter 6 flagged that some DP problems need a **compressed state
representation** when the natural state space is too large to tabulate
directly. **Bitmasking** is the concrete technique: representing a small
set (which items are used, which cities are visited) as the bits of a
single integer, letting the DP state be `(bitmask, other dimensions)`
instead of needing an explicit set data structure per state.

The Traveling Salesman Problem's DP formulation is the canonical example:
naive brute force checks all n! permutations of city visit order.
Bitmask DP represents "which cities have been visited" as an n-bit mask
(2ⁿ possible values) combined with "current city" (n values), giving
`O(2ⁿ · n²)` — astronomically better than n! for even moderate n (n=20:
2²⁰·400 ≈ 4×10⁸ versus 20! ≈ 2.4×10¹⁸), though still exponential — this
doesn't make TSP polynomial (it's NP-hard, chapter 10), it makes the
exponential base dramatically smaller.

> **Interview lens:** Recognizing "the state I need is a small subset of
> a bounded universe" as a bitmask-DP signal — rather than reaching for a
> `HashSet` per state, which would blow up both memory and the ability to
> use the mask directly as an array index — is exactly the state-
> compression skill chapter 6 flagged as often the hardest part of a new
> DP problem.

## Key takeaways

- KMP achieves guaranteed O(n + m) string matching by precomputing a
  failure function so the text pointer never backtracks — reusing partial
  match information instead of discarding it on mismatch.
- Rabin-Karp uses a rolling hash as a cheap filter before full comparison;
  average case matches KMP, but worst case degrades to O(nm) under hash
  collisions — the same collision-rate risk as hash tables generally.
- Bitwise tricks (`n & (n-1)`, `n & -n`, XOR's self-canceling property)
  exploit the machine's native word-level parallelism for compact,
  extremely fast small-set operations.
- Bitmasking-as-DP-state is chapter 6's state-compression technique made
  concrete: representing a bounded subset as an integer's bits, turning
  an intractable state space (TSP's n! permutations) into a merely
  exponential-but-much-smaller one (2ⁿ·n²).
- Recognizing "small bounded subset" as a bitmask signal — rather than
  defaulting to a general-purpose set structure — is a direct, practical
  instance of chapter 6's broader "identify the minimal sufficient state"
  discipline.
