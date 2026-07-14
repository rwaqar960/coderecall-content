---
id: algo-06
title: Dynamic Programming Patterns
minutes: 17
level: senior
---

Chapter 5 gave the mechanical workflow. This chapter builds pattern
recognition: the small number of recognizable "shapes" that a huge
fraction of DP problems collapse into. Learning these shapes — not
individual problems — is what lets you solve a DP problem you've never
seen, because you recognize which *family* it belongs to.

## Shape 1: 0/1 Knapsack — include-or-exclude decisions

Given items with weight and value, and a capacity, maximize value without
exceeding capacity, each item used at most once. The state is
**(item index, remaining capacity)**, and the recurrence is a direct
translation of "for each item, either skip it or take it":

```java
// dp[i][w] = max value using first i items with capacity w
int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];                    // skip item i
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]);  // take it
            }
        }
    }
    return dp[n][capacity];
}
```

The recognizable signal: **a fixed resource budget, and per-item binary
decisions that consume some of it.** Subset-sum, partition-into-equal-
subsets, and "minimum coins to make change with limited coin counts" are
all this exact shape wearing different framing.

## Shape 2: Longest Common Subsequence — two-pointer state over two sequences

Given two sequences, find the longest subsequence common to both
(elements in order, not necessarily contiguous). State is **(position in
sequence A, position in sequence B)**:

```java
int lcs(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i <= a.length(); i++) {
        for (int j = 1; j <= b.length(); j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;               // characters match: extend
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // skip from one side
            }
        }
    }
    return dp[a.length()][b.length()];
}
```

**Edit distance** (minimum insertions/deletions/substitutions to transform
one string into another) is the same two-index state with a different
combine rule per cell (three options — insert, delete, substitute —
instead of two). Recognizing LCS and edit distance as the *same shape*
with different per-cell logic is what lets "I've solved edit distance
before" transfer to a novel two-sequence-alignment problem.

> **Interview lens:** The signal for this shape: **two sequences, and a
> question about how they relate positionally** (common subsequence,
> minimum transformation, interleaving). The state is almost always
> "(position in A, position in B)" — writing that down first orients the
> rest of the solution.

## Shape 3: Grid DP — path-counting and path-optimization

Given a grid, count paths or find optimal-cost paths from one corner to
another, typically moving only right/down. State is **(row, column)**,
and each cell's value depends on the cells that could reach it:

```java
// Minimum path sum, moving only right or down
int minPathSum(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    int[][] dp = new int[rows][cols];
    dp[0][0] = grid[0][0];
    for (int c = 1; c < cols; c++) dp[0][c] = dp[0][c - 1] + grid[0][c];
    for (int r = 1; r < rows; r++) dp[r][0] = dp[r - 1][0] + grid[r][0];
    for (int r = 1; r < rows; r++) {
        for (int c = 1; c < cols; c++) {
            dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1]);
        }
    }
    return dp[rows - 1][cols - 1];
}
```

This is structurally the same "combine from valid predecessors" idea as
LCS's two-index state — grid DP is what LCS looks like when the two
"sequences" are literally the grid's row and column axes. Seeing this
connection is what turns "grid DP" and "sequence-pair DP" from two
memorized categories into one recognized pattern applied twice.

## Reading a problem for its state, not its surface description

The actual skill this chapter builds: given a new problem, identify
**which axes the state needs to vary over.** A useful diagnostic
sequence:

1. **What decision repeats?** (include/exclude an item, align/skip a
   character, choose a direction) — this is usually one axis of state.
2. **What running constraint needs tracking?** (remaining capacity,
   position reached, count of some resource used so far) — this is
   usually the other axis, or an additional one.
3. **Is the state space bounded and small enough to tabulate?** If the
   naturally-identified state has too many dimensions or too large a
   range, the problem may need a smarter state representation (chapter 9's
   bitmask-as-DP-state technique is exactly this move) — recognizing state
   explosion early avoids building an infeasible table.

> **Trade-off:** Correctly identifying the *minimal sufficient state* is
> usually the hardest and most valuable part of solving a new DP problem
> — too little state produces an incorrect recurrence (the past you
> discarded turns out to matter); too much state produces a correct but
> infeasibly large table. Both failure directions are common, and the fix
> for each is different (add a dimension vs. find a way to compress one).

## Key takeaways

- 0/1 Knapsack's shape: fixed resource budget, per-item include/exclude
  decisions — state is (item index, remaining budget). Subset-sum and
  bounded coin-change are the same shape.
- LCS/edit-distance's shape: two sequences, a question about their
  positional relationship — state is (position in A, position in B), with
  the per-cell combine rule distinguishing the specific problem.
- Grid DP is sequence-pair DP applied to a grid's row/column axes — the
  same "combine from valid predecessors" idea, not a separate pattern to
  memorize independently.
- The transferable skill is reading a new problem for its **state axes**
  (what decision repeats, what constraint is tracked) rather than
  matching it to a memorized problem — this is what lets DP patterns
  generalize to unseen problems.
- Identifying the minimal sufficient state is usually the hardest part:
  too little state breaks correctness, too much makes the table
  infeasibly large — both are real, distinct failure modes to watch for.
