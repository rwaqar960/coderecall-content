---
id: dsa-07
title: "Graphs: Representations and Traversal"
minutes: 15
level: senior
---

Every tree in this course is secretly a graph with an extra constraint (no
cycles, one path between any two nodes). Dropping that constraint is what
lets graphs model the things trees can't: social networks, dependency
graphs, road networks, state machines — anything where relationships aren't
strictly hierarchical. The senior-level skill here is less about knowing
BFS and DFS exist, and more about choosing the right *representation*
before writing either.

## Two representations, and a real memory-vs-speed trade-off

- **Adjacency list**: each node stores a list of its neighbors. Memory is
  O(V + E) — proportional to what's actually there. Checking "are u and v
  connected?" costs O(degree of u) — you scan u's neighbor list.
- **Adjacency matrix**: a V×V grid where `matrix[u][v]` is true if an edge
  exists. Memory is O(V²) **regardless of edge count**. Checking "are u and
  v connected?" is O(1) — direct index.

```java
// Adjacency list: memory scales with actual edges
Map<Integer, List<Integer>> adjList = new HashMap<>();

// Adjacency matrix: memory is fixed at V^2, however sparse the graph
boolean[][] adjMatrix = new boolean[V][V];
```

The decision is a direct function of graph **density**. A social network
with a billion users and an average of a few hundred connections each is
**sparse** — E ≈ 200 billion is still ≪ V² (a billion squared). An
adjacency matrix there would need exabytes for mostly-false entries. A
densely-connected small graph (every node plausibly connects to every
other, V is small) can afford O(V²) for O(1) edge lookups.

> **Interview lens:** "Which representation would you use?" has no single
> correct answer without knowing the graph's density and the *query
> pattern* — O(1) edge-existence checks favor a matrix; "give me all of X's
> neighbors" favors a list. Answering with a representation before asking
> about density and access pattern is the tell of memorized-not-understood
> knowledge.

## BFS and DFS answer different questions

Both visit every reachable node in O(V + E) — the same complexity — so the
choice between them is about **what property of the traversal you need**,
not speed:

```java
// BFS: level by level, using a queue — chapter 4's FIFO discipline
void bfs(int start, Map<Integer, List<Integer>> adj) {
    Queue<Integer> queue = new ArrayDeque<>();
    Set<Integer> visited = new HashSet<>();
    queue.offer(start); visited.add(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adj.getOrDefault(node, List.of())) {
            if (visited.add(neighbor)) queue.offer(neighbor);
        }
    }
}

// DFS: as deep as possible before backtracking — chapter 4's LIFO discipline
void dfs(int node, Map<Integer, List<Integer>> adj, Set<Integer> visited) {
    if (!visited.add(node)) return;
    for (int neighbor : adj.getOrDefault(node, List.of())) {
        dfs(neighbor, adj, visited);
    }
}
```

- **BFS finds shortest paths in unweighted graphs**, because it explores
  in strict distance order — the first time you reach a node is
  guaranteed to be via a shortest path. This is *why* level-order tree
  traversal (chapter 5) and BFS are the same idea: a tree is just a graph
  where BFS never revisits.
- **DFS is the natural fit for structural questions**: does a path exist
  at all, is there a cycle, can this graph be topologically ordered,
  connected-components counting. DFS's implicit call stack (or explicit
  stack) naturally tracks "the path so far," which cycle detection and
  topological sort both need.

> **Trade-off:** DFS's recursive form is simpler to write correctly but
> inherits chapter 4's stack-depth risk on deep or adversarially-shaped
> graphs (a long chain triggers O(V) recursion depth) — an explicit
> stack-based DFS avoids that at the cost of more code. For graphs of
> unknown or attacker-influenced size, prefer the explicit-stack version.

## Topological sort: ordering with dependencies

A **topological sort** orders nodes so every directed edge u→v places u
before v — the exact shape of "build steps," "course prerequisites," or
"package dependency resolution." It only exists for a **DAG** (directed
acyclic graph); a cycle means no valid order exists (A must come before B,
which must come before A — unsatisfiable).

```java
// Kahn's algorithm: BFS-based topological sort using in-degree
List<Integer> topoSort(int V, Map<Integer, List<Integer>> adj) {
    int[] inDegree = new int[V];
    for (var neighbors : adj.values())
        for (int v : neighbors) inDegree[v]++;

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < V; i++) if (inDegree[i] == 0) queue.offer(i);

    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : adj.getOrDefault(node, List.of())) {
            if (--inDegree[neighbor] == 0) queue.offer(neighbor);
        }
    }
    return order.size() == V ? order : List.of();  // empty: a cycle exists
}
```

The elegant side effect: **if the resulting order has fewer than V nodes,
the graph contains a cycle** — Kahn's algorithm is simultaneously a
topological sort *and* a cycle detector, because a cycle's nodes never
reach in-degree zero and so never enter the queue.

> **Interview lens:** "Detect a cycle in a directed graph" and "topologically
> sort a DAG" are the same underlying question asked two ways. Recognizing
> that Kahn's algorithm (or DFS with a recursion-stack marker) answers both
> simultaneously is a strong signal of understanding the structure, not
> just two memorized algorithms.

## Key takeaways

- Representation choice is a memory-vs-query trade-off driven by density:
  adjacency list for sparse graphs (common at real scale), adjacency
  matrix only when O(1) edge-existence checks matter and V is small enough
  to afford O(V²) memory.
- BFS and DFS are both O(V + E); pick by what you need, not speed — BFS
  for shortest paths in unweighted graphs (explores in distance order),
  DFS for structural questions (cycles, connectivity, ordering).
- DFS's recursive elegance inherits the call-stack depth risk from
  chapter 4; use an explicit stack for graphs of unknown or adversarial
  size.
- Topological sort only exists for DAGs; Kahn's algorithm (BFS + in-degree)
  detects a cycle as a side effect of failing to produce a full ordering —
  the same structural fact, answered two ways.
