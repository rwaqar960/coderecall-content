---
id: dsa-09
title: Tries and Union-Find
minutes: 15
level: senior
---

This chapter pairs two structures that rarely show up in "top 10 data
structures" lists but solve their specific problems so much better than
the general-purpose alternative that recognizing when to reach for them is
a genuine differentiator. Both also make a recurring point of this course
concrete: the right structure encodes the problem's shape directly, instead
of forcing a general-purpose structure to approximate it.

## Tries: a hash map's alternative for prefix-shaped problems

A **trie** (prefix tree) stores strings by sharing common prefixes as a
path from the root — each node represents one character, and a path from
root to a marked node spells a stored word.

```java
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isWord = false;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new TrieNode());
        }
        node.isWord = true;
    }

    boolean startsWith(String prefix) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            node = node.children.get(c);
            if (node == null) return false;
        }
        return true;   // prefix exists, regardless of whether it's a full word
    }
}
```

A `HashSet<String>` can answer "is this exact word present?" in O(1)
average — genuinely competitive with a trie for that single question. What
a hash set **cannot do efficiently** is "give me everything starting with
this prefix" — that requires scanning every stored string, O(n·k) for n
strings of length k. A trie answers it in O(p) — the prefix length alone —
because the prefix's existence *is* a path in the tree, and everything
below that path shares it by construction.

> **Interview lens:** "Design autocomplete" is a trie question wearing a
> product-feature costume. The tell: autocomplete is fundamentally a
> "all words starting with X" query, which is the exact shape a trie
> is built for and a hash set structurally cannot serve efficiently.

The trade-off is memory: each node can hold up to alphabet-size children
references, so a trie of many short, dissimilar strings can use more
memory than a flat hash set of the same strings — the space saving comes
specifically from **shared prefixes**, which is why tries excel for
dictionaries, IP-routing tables (prefix matching is literally the
routing problem), and autocomplete, but aren't a general string-storage
upgrade.

## Union-Find: near-O(1) answers to "are these connected?"

Union-find (disjoint set) answers exactly two questions efficiently, over
a fixed universe of elements grouped into disjoint sets: **find** (which
group is x in?) and **union** (merge x's group and y's group). It appeared
already in the previous chapter powering Kruskal's cycle check — here's why
it's fast enough to use inside a tight loop.

```java
class UnionFind {
    int[] parent, rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;   // each starts as its own group
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  // path compression
        return parent[x];
    }

    boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false;             // already connected: a cycle
        if (rank[rootX] < rank[rootY]) { int t = rootX; rootX = rootY; rootY = t; }
        parent[rootY] = rootX;                          // union by rank
        if (rank[rootX] == rank[rootY]) rank[rootX]++;
        return true;
    }
}
```

Two independent optimizations, and both are required to reach the
near-O(1) bound (technically O(α(n)), where α is the **inverse Ackermann
function** — grows so slowly it's under 5 for any input size that could
ever exist physically, which is why "near-constant" is the accurate,
practical framing, not an exaggeration):

- **Path compression**: `find` rewires every node it passes through to
  point directly at the root, flattening future lookups — a self-optimizing
  structure that gets faster as it's used.
- **Union by rank**: always attach the shorter tree under the taller one's
  root, preventing the "insert in sorted order" degenerate-height problem
  from chapter 5's BST discussion — union-find would have the exact same
  linked-list-shaped worst case without it.

Without both optimizations, union-find degrades toward O(n) per operation
in the worst case (a plain linked-list-shaped tree from naive unioning);
with both, it's effectively constant for any real input.

> **Interview lens:** "Why is union-find near-O(1) instead of O(log n)?" —
> the complete answer names *both* optimizations working together, not
> just one. Path compression alone or union by rank alone still gives
> O(log n); the combination is what reaches the inverse-Ackermann bound.

## Where union-find beats a plain graph traversal

The problem shape "are these two nodes connected, checked repeatedly, as
edges are added incrementally over time" is exactly where union-find wins
over re-running BFS/DFS from scratch each time. A live example: **detecting
when a new edge would form a cycle**, one edge at a time, as edges stream
in (Kruskal's algorithm, but also network-formation and social-graph
"friend of a friend" connectivity checks) — re-running DFS after every new
edge is O(V+E) per check; union-find answers each incremental query in
near-O(1).

> **Trade-off:** Union-find only answers "are x and y connected" — it
> cannot reconstruct the *path* between them, or answer "what's the
> shortest path," or handle edge *removal* efficiently (removing an edge
> can split a group, which union-find's one-way merge structure doesn't
> support without rebuilding). Reach for it specifically for incremental
> connectivity questions with edges only ever added, never removed.

## Key takeaways

- Tries answer "give me everything starting with this prefix" in O(prefix
  length), which a hash set cannot do efficiently at all (O(n·k) full
  scan) — the shared-prefix structure is the entire advantage, so tries
  win specifically for prefix-shaped problems (autocomplete, IP routing),
  not as a general string-storage replacement.
- Union-find answers "are x and y connected?" and "merge these two
  groups" in near-O(1) (technically O(inverse-Ackermann)) — but only with
  **both** path compression and union by rank; either alone leaves it at
  O(log n).
- Without those optimizations, union-find degrades toward O(n) per
  operation, the same kind of degenerate-height failure as an unbalanced
  BST (chapter 5) — this isn't a coincidence, it's the same underlying
  height-control problem solved differently.
- Union-find is the right tool for incremental connectivity questions
  (edges added over time, repeatedly asking "connected yet?") — it cannot
  reconstruct paths or handle edge removal; know that boundary before
  reaching for it.
