---
id: algo-08
title: Backtracking and Constraint Search
minutes: 15
level: senior
---

Backtracking is what you reach for when a problem needs every valid
solution (or the first one, or a count of them), and neither DP's
overlapping-subproblem structure nor greedy's provable local-choice
correctness applies. It's systematic brute force — but the "systematic"
part, specifically **pruning**, is what separates a backtracking solution
that finishes from one that doesn't.

## The shape: choose, explore, un-choose

Backtracking builds a solution incrementally, like greedy — but unlike
greedy, it **can undo a choice** and try the next option when the current
path turns out invalid or exhausted:

```java
void backtrack(List<Integer> current, boolean[] used, int[] nums, List<List<Integer>> result) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));   // a complete valid solution
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        current.add(nums[i]);        // choose
        used[i] = true;
        backtrack(current, used, nums, result);  // explore
        current.remove(current.size() - 1);      // un-choose
        used[i] = false;
    }
}
```

This generates all permutations — the **choose / explore / un-choose**
pattern is the entire template; the specific problem only changes what
counts as a valid choice and a complete solution.

## Pruning: the difference between brute force and backtracking

Generating all permutations and *checking* each one against constraints
afterward is brute force — correct, but wasteful, since invalid partial
solutions still get fully extended before being rejected. **Backtracking's
actual value is pruning**: checking constraints *during* construction, so
an invalid partial solution is abandoned immediately rather than extended
further.

**N-Queens** makes this concrete: place N queens on an N×N board so none
attacks another. Without pruning, you'd generate all N^N placements and
filter — astronomically wasteful. With pruning, you check "does this
column/diagonal already have a queen?" **before** recursing into the next
row, cutting off entire invalid subtrees immediately:

```java
boolean isValid(int[] queens, int row, int col) {
    for (int r = 0; r < row; r++) {
        int c = queens[r];
        if (c == col || Math.abs(c - col) == row - r) return false;  // same column or diagonal
    }
    return true;
}

void solve(int[] queens, int row, int n, List<int[]> solutions) {
    if (row == n) { solutions.add(queens.clone()); return; }
    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;
            solve(queens, row + 1, n, solutions);   // only recurse into valid placements
        }
    }
}
```

The pruning check (`isValid`) is what makes N-Queens for N=8 run
instantly instead of needing to enumerate 8⁸ (roughly 16 million) raw
placements — most of the search tree is never visited at all, because
`isValid` rejects it before recursion descends further.

> **Interview lens:** "How would you optimize your backtracking
> solution?" is almost always asking for a tighter or earlier pruning
> check — checking a constraint one recursion level sooner can cut off an
> entire exponential subtree, which is a far bigger win than any
> constant-factor code optimization.

## Backtracking vs. brute force vs. DP: choosing correctly

- **Brute force**: generate everything, filter after. Simple, always
  correct, wasteful — fine for tiny inputs, where the wasted work doesn't
  matter.
- **Backtracking**: generate incrementally, prune during construction.
  Same worst-case complexity as brute force in the theoretical limit, but
  the *actual* explored space is usually far smaller — the right choice
  when you need all (or one, or a count of) valid solutions and no DP
  structure applies.
- **DP**: applies specifically when subproblems overlap (chapter 5) —
  backtracking problems (permutations, subsets, N-Queens) typically
  *don't* have overlapping subproblems in the DP sense (each partial
  placement is a distinct path, not a repeated one), which is exactly why
  they need backtracking's exhaustive-with-pruning approach rather than a
  DP table.

> **Trade-off:** Backtracking's worst-case complexity is often still
> exponential (N-Queens is no exception) — pruning reduces the *practical*
> explored space dramatically for typical inputs, but doesn't change the
> underlying complexity class. Know this before promising a backtracking
> solution will be "fast" — it's fast in practice for the pruned space,
> not fast in the asymptotic sense DP or greedy can sometimes offer.

## Subsets and combinations: the same template, different completion rule

Generating all subsets of a set uses the identical choose/explore/
un-choose shape, just with a different notion of "complete" (every
element has been decided, include or exclude, rather than every position
filled):

```java
void subsets(int[] nums, int index, List<Integer> current, List<List<Integer>> result) {
    if (index == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }
    // exclude nums[index]
    subsets(nums, index + 1, current, result);
    // include nums[index]
    current.add(nums[index]);
    subsets(nums, index + 1, current, result);
    current.remove(current.size() - 1);
}
```

Notice this is structurally the *same choice tree* as 0/1 Knapsack's
recurrence (chapter 6) — include or exclude, one item at a time. The
difference is what happens with each branch: knapsack **caches and
combines** (DP, because subproblems overlap across different orderings
reaching the same remaining-capacity state), while subsets **explores
and collects** (backtracking, because every path is a distinct answer
that must be individually recorded, not combined into a single optimum).

> **Interview lens:** Recognizing that subsets, permutations, and 0/1
> knapsack all start from the *same* include/exclude choice tree — and
> differ only in whether the goal is "collect every path" (backtracking)
> or "find the best combined value across overlapping paths" (DP) — is a
> genuinely unifying, staff-level observation that most candidates never
> connect explicitly.

## Key takeaways

- Backtracking's template is choose → explore → un-choose — the same
  incremental-building idea as greedy, but with the ability to undo and
  try alternatives.
- Pruning (rejecting invalid partial solutions during construction, not
  after completion) is what makes backtracking practical — N-Queens'
  `isValid` check cuts off entire invalid subtrees before they're built.
- Backtracking fits problems needing all/one/a-count-of valid solutions
  where DP doesn't apply — typically because the problem's subproblems
  don't overlap (each path is distinct), unlike DP's overlapping-
  subproblem requirement.
- Worst-case complexity often stays exponential even with pruning —
  pruning shrinks the practically-explored space, not the asymptotic
  complexity class.
- Subsets, permutations, and 0/1 knapsack share the same include/exclude
  choice-tree shape; they differ in whether paths are individually
  collected (backtracking) or combined via overlapping-subproblem caching
  (DP) — recognizing this connects three "different" techniques as one.
