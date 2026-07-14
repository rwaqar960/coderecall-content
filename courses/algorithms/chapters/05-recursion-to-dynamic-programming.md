---
id: algo-05
title: Recursion to Dynamic Programming
minutes: 16
level: senior
---

Chapter 4 closed by naming the tell: overlapping subproblems mean divide
and conquer is the wrong tool. This chapter is the fix — dynamic
programming, which is less a separate algorithm family than a *mechanical
transformation* applied to an already-correct recursive solution. Once
you've written the recursion correctly, DP is a checklist, not a fresh
design problem.

## Two requirements, and how to check for them

Dynamic programming applies when a problem has:

1. **Optimal substructure** — an optimal solution to the problem contains
   optimal solutions to its subproblems. (Shortest path: the shortest
   path from A to C through B contains the shortest path from A to B.)
2. **Overlapping subproblems** — the same subproblem is reached via
   multiple different recursive paths. (Chapter 4's Fibonacci example.)

The practical check for both: **write the brute-force recursion first**.
If it's correct but slow, look at what arguments repeat across recursive
calls — that's the overlapping-subproblems signal, and it tells you
exactly what to cache.

## Memoization: the smallest possible change

**Memoization** is the direct fix — same recursive structure, plus a
cache keyed by the arguments that vary:

```java
// Before: exponential, recomputes fib(n-2) many times
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

// After: identical logic, one cache added
int fibMemo(int n, Map<Integer, Integer> cache) {
    if (n <= 1) return n;
    if (cache.containsKey(n)) return cache.get(n);
    int result = fibMemo(n - 1, cache) + fibMemo(n - 2, cache);
    cache.put(n, result);
    return result;
}
```

This is the entire transformation: O(2ⁿ) becomes O(n), because each
distinct `n` is now computed exactly once — every subsequent call with
the same argument is an O(1) cache hit. **The recursive logic didn't
change at all.** This is why "write the brute force, then memoize" is a
reliable strategy rather than a trick: correctness transfers directly,
because you haven't touched the logic, only added caching.

## Tabulation: the same idea, built bottom-up

**Tabulation** computes the same values, but iteratively from the smallest
subproblem upward, filling a table instead of recursing downward with a
cache:

```java
int fibTab(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}
```

Same O(n) complexity, same correctness argument (optimal substructure,
each subproblem solved once) — but two real, practical differences from
memoization:

- **No recursion, so no call-stack depth risk** (the DSA course's chapter
  4 concern) — tabulation is iterative by construction.
- **Solves every subproblem up to n**, even ones the original problem
  might not need, whereas memoization (being demand-driven) only computes
  what's actually reached. For problems where large parts of the
  subproblem space are unreachable, memoization can do strictly less work.

> **Trade-off:** Neither is universally better. Tabulation's iteration
> order must be derivable (you need to know dependencies are already
> computed when you reach each cell — not always trivial for complex
> state spaces); memoization handles arbitrary dependency graphs for free
> via recursion, at the cost of call-stack depth and per-call overhead.

## Space optimization: the payoff of seeing the access pattern

Once tabulation makes the dependency structure explicit as a table, a
further optimization often falls out: if `dp[i]` only ever depends on the
last one or two rows (as in Fibonacci — `dp[i]` needs only `dp[i-1]` and
`dp[i-2]`), the full O(n) table can shrink to O(1) variables:

```java
int fibSpaceOptimized(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

This optimization is **only visible from the tabulated form** — the
recursive/memoized version's access pattern is obscured by the call
stack, while the table's row-by-row dependency is explicit and inspectable.
This is a genuine reason to write the tabulated version even when
memoization would have been faster to implement: it exposes a further
optimization the recursive form hides.

> **Interview lens:** "Can you optimize the space complexity of your DP
> solution?" is asking whether you can read the *dependency pattern* off
> your own table — "each row only depends on the previous two rows" is
> the kind of observation that turns O(n) space into O(1), and it's a
> concrete, checkable claim, not a vague optimization gesture.

## The workflow, stated plainly

1. Write the brute-force recursion. Verify it's correct (small inputs,
   by hand or by test) before optimizing anything.
2. Identify the state — the *minimal* set of arguments that determine a
   subproblem's answer. (This is often smaller than the full parameter
   list; recognizing the true state is frequently the hardest part.)
3. Add memoization keyed by that state. You now have a working DP solution.
4. If needed, convert to tabulation (iteration order = dependency order).
5. If the access pattern allows it, reduce the table to only the rows
   actually still needed.

Each step is a mechanical transformation of the previous one, correctness-
preserving throughout — which is why this workflow, followed in order, is
more reliable than trying to "see the DP" and write the final optimized
form directly.

## Key takeaways

- DP requires optimal substructure (subproblem solutions compose into the
  full solution) and overlapping subproblems (the same subproblem
  reached multiple ways) — write the brute-force recursion first to check
  for both.
- Memoization is the minimal change: identical recursive logic, plus a
  cache — correctness transfers automatically since the logic is
  untouched.
- Tabulation computes the same values bottom-up, avoiding recursion depth
  risk and sometimes doing less redundant work exploration, at the cost
  of needing a derivable iteration order.
- Space optimization (full table → O(1) variables) is often only visible
  once the dependency pattern is explicit in tabulated form — a concrete
  reason to tabulate even when memoization was easier to write first.
- The reliable workflow: brute-force recursion → identify true state →
  memoize → (optionally) tabulate → (optionally) reduce space — each step
  mechanical and correctness-preserving.
