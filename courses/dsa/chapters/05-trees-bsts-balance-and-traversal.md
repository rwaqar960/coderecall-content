---
id: dsa-05
title: "Trees: BSTs, Balance, and Traversal"
minutes: 16
level: senior
---

"Binary search trees give O(log n) operations" is true and also, without a
qualifier, misleading — an unbalanced BST degrades to a linked list with
extra steps, O(n) worst case. The qualifier — *balanced* — is where the
actual engineering lives, and it's what separates knowing the BST invariant
from understanding why production tree structures (`TreeMap`, database
indexes, filesystem structures) all pay a rebalancing cost you never see.

## The BST invariant, and how it fails silently

A binary search tree's entire value proposition rests on one invariant:
every node's left subtree contains only smaller values, its right subtree
only larger. This is chapter 1 of the OOP course, restated for trees — an
invariant that must be enforced at every insertion, because nothing else
checks it for you.

```java
class TreeNode { int val; TreeNode left, right; }

TreeNode insert(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insert(root.left, val);
    else if (val > root.val) root.right = insert(root.right, val);
    return root;
}
```

The invariant guarantees O(log n) search **only if the tree is roughly
balanced** — height proportional to log(n). Insert values in sorted order
(1, 2, 3, 4, 5...) and every node has only a right child: the "tree" is a
linked list, O(n) height, and every operation degrades to O(n). This isn't
a rare edge case — sorted or nearly-sorted input is common in real data
(timestamps, auto-incrementing IDs, imported sorted files), which is
exactly why production systems don't use plain BSTs.

> **Interview lens:** "What's the worst case for BST operations?" — the
> complete answer names the *cause* (sorted/adversarial insertion order
> degenerates height to O(n)) and the *fix category* (self-balancing
> variants), not just the number.

## Self-balancing trees: paying a small tax to guarantee the invariant

Self-balancing trees restore the O(log n) guarantee by doing extra work on
insert/delete to keep height bounded — the same "pay a little on write to
keep reads fast" trade this course keeps returning to (dynamic array
resizing, hash table load factor).

- **AVL trees** enforce a strict balance: subtree heights differ by at most
  1 at every node, using rotations after insert/delete. Very tight balance
  → faster lookups, but more rotations on write.
- **Red-black trees** enforce a looser balance (via a coloring invariant
  that bounds height to at most ~2x the minimum), needing fewer rotations
  on average. Slightly slower lookups than AVL in theory, faster writes in
  practice — which is why **Java's `TreeMap` and `TreeSet`, and C++'s
  `std::map`, use red-black trees**, not AVL. This is the same insight from
  chapter 2 of the OOP course (HashMap's bucket-to-tree fallback, when a
  chain gets long, also uses a red-black tree) — it's the standard-library
  default balance point across languages, not a coincidence.

> **Trade-off:** AVL vs red-black is a direct read-vs-write trade-off:
> read-heavy, write-rarely workloads lean AVL; write-heavy or mixed
> workloads lean red-black. Naming *which* self-balancing tree a language's
> standard library actually uses, and why, is what separates "I've heard of
> AVL trees" from engineering judgment.

## Traversals: same tree, different questions answered

The four traversal orders aren't interchangeable trivia — each answers a
different practical question:

```java
void inorder(TreeNode n)   { if (n==null) return; inorder(n.left); visit(n); inorder(n.right); }
void preorder(TreeNode n)  { if (n==null) return; visit(n); preorder(n.left); preorder(n.right); }
void postorder(TreeNode n) { if (n==null) return; postorder(n.left); postorder(n.right); visit(n); }
```

- **Inorder** visits a BST's values in **sorted order** — the direct
  consequence of the BST invariant. Use it whenever you need sorted output
  without a separate sort step.
- **Preorder** visits a node before its children — the shape you'd use to
  **serialize a tree for reconstruction** (root first, so a parser can
  build top-down) or to copy/clone a tree structure.
- **Postorder** visits children before the parent — the shape required
  whenever a node's processing *depends on* its children's results first:
  computing subtree sizes, safely deleting a tree bottom-up (free children
  before the parent), or evaluating an expression tree.
- **Level-order** (BFS with a queue, not really a "traversal" in the
  recursive sense) visits nodes by depth — the right choice for anything
  depth-sensitive, like finding the tree's width at each level or the
  shortest path in an unweighted tree.

> **Interview lens:** Being asked to "serialize and deserialize a binary
> tree" is really asking whether you know preorder is the traversal that
> makes top-down reconstruction possible — picking inorder here (which
> loses parent-child shape information) is the tell that the choice was
> memorized, not understood.

## Height, balance factor, and why "just check if it's balanced" is subtle

A naive "is this tree balanced?" check that calls `height()` on every node
separately is itself O(n²) — recomputing height repeatedly for subtrees
already visited. The senior-level fix computes height and balance in the
**same bottom-up pass**, returning early once an imbalance is found:

```java
int checkHeight(TreeNode n) {
    if (n == null) return 0;
    int left = checkHeight(n.left);
    if (left == -1) return -1;                 // imbalance already found below
    int right = checkHeight(n.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;  // this node is unbalanced
    return Math.max(left, right) + 1;
}
boolean isBalanced(TreeNode root) { return checkHeight(root) != -1; }
```

This is postorder traversal (children resolved before the parent decides
anything) doing double duty: one O(n) pass computes height *and* detects
imbalance, versus the naive O(n²) of computing height fresh at every node.

## Key takeaways

- The BST invariant guarantees O(log n) only when height stays O(log n) —
  sorted/adversarial insertion order degrades a plain BST to O(n), a
  common real-world case, not a rare edge case.
- Self-balancing trees trade write-time work for a guaranteed height bound;
  AVL balances tighter (read-optimized), red-black balances looser
  (write-optimized) — which is why TreeMap/std::map use red-black, not AVL.
- Inorder = sorted output; preorder = serialization/cloning (parent before
  children); postorder = bottom-up dependent computation (children before
  parent); level-order = depth-sensitive questions. Pick by the question,
  not by habit.
- Checking tree balance naively is O(n²) if height is recomputed per node;
  a single bottom-up (postorder) pass computing height-and-imbalance
  together is the O(n) fix.
