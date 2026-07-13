---
id: dsa-08
title: Graph Algorithms at Scale
minutes: 17
level: staff
---

BFS finds shortest paths — in unweighted graphs. The moment edges have
different costs (distance, latency, price), BFS's "explore in distance
order" guarantee stops holding, and a different family of algorithms takes
over. These are the algorithms actually running inside route planners,
network routers, and infrastructure provisioning tools — not textbook
exercises.

## Why BFS breaks the moment edges have weights

BFS's shortest-path guarantee depends on exploring nodes in strict
distance order — true only when every edge costs exactly 1 step. With
weighted edges, a node reached via more *hops* can still be reached via
less *total cost*, and BFS's queue has no way to represent "this path is
cheaper, revisit."

## Dijkstra's algorithm: BFS with a priority queue instead of a plain queue

Dijkstra's algorithm is the natural generalization: replace the plain
queue with a **min-heap keyed by current known distance** (chapter 6's
priority queue), always expanding the *closest* not-yet-finalized node
next.

```java
int[] dijkstra(int src, int V, Map<Integer, List<int[]>> adj) { // int[]{neighbor, weight}
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    pq.offer(new int[]{src, 0});

    while (!pq.isEmpty()) {
        int[] current = pq.poll();
        int node = current[0], d = current[1];
        if (d > dist[node]) continue;             // stale entry, already improved
        for (int[] edge : adj.getOrDefault(node, List.of())) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = d + weight;
            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.offer(new int[]{neighbor, newDist});
            }
        }
    }
    return dist;
}
```

Complexity is O((V + E) log V) — the log V factor is the heap operations
from chapter 6, replacing BFS's O(1) queue operations. This is a direct,
concrete payoff of understanding heaps: Dijkstra *is* "BFS, but the queue
became a priority queue because edges stopped being uniform" — not a
separate algorithm to memorize independently.

> **Interview lens:** "How does Dijkstra's algorithm differ from BFS?" —
> the strongest answer names the single structural change (plain queue →
> min-heap ordered by distance) and *why* it's necessary (weighted edges
> break BFS's distance-order guarantee), rather than reciting Dijkstra's
> steps as an unrelated procedure.

## Dijkstra's one hard requirement: no negative weights

Dijkstra assumes that once a node is popped from the priority queue with
its minimum distance, that distance is **final** — no future discovery
could ever improve it, because everything still in the queue has distance
≥ the popped value. **A negative edge weight breaks this assumption**: a
later path through a negative edge could retroactively beat an
already-finalized "shortest" distance, and Dijkstra has no mechanism to
revisit a finalized node.

For graphs with negative weights (but no negative *cycles*, which would
make "shortest path" undefined — you could loop the cycle forever, getting
cheaper each time), **Bellman-Ford** is the correct tool: it relaxes every
edge V−1 times, which is provably enough for the true shortest distance to
propagate through any simple path, at the cost of O(V·E) — much slower than
Dijkstra, but correct where Dijkstra silently isn't.

> **Trade-off:** This is a real, production-relevant choice, not a
> textbook footnote: currency arbitrage detection, certain routing-cost
> models with rebates/discounts (effectively negative edges), and
> financial graphs can have legitimately negative weights. Reaching for
> Dijkstra there produces a wrong answer with no error — silently wrong is
> worse than slow, which is why knowing this boundary matters more than
> memorizing either algorithm's pseudocode.

## Minimum spanning trees: connect everything, cheapest total cost

A different but related problem: given a connected, weighted, undirected
graph, find the minimum-total-weight set of edges that keeps every node
connected (a **spanning tree** — connects all V nodes using exactly V−1
edges, no cycles). This is the literal shape of "lay cable to connect
every building for the least total wire" or "design a network backbone at
minimum cost."

Two standard algorithms, both **greedy** (a proven-correct instance of
greedy choice, unlike most greedy heuristics which need case-by-case
justification):

- **Kruskal's**: sort all edges by weight; add each edge if it doesn't
  create a cycle, using **union-find** (next chapter) to test that in
  near-O(1). Naturally suited to sparse graphs (sorting E edges dominates).
- **Prim's**: grow one tree from a start node, always adding the cheapest
  edge that connects the tree to a new node, using a priority queue (the
  same heap-based "always take the cheapest available option" shape as
  Dijkstra). Naturally suited to dense graphs.

```java
// Kruskal's: sort edges, use union-find to skip cycle-creating edges
int minSpanningTree(int V, int[][] edges) {  // edges = {u, v, weight}
    Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
    UnionFind uf = new UnionFind(V);
    int totalWeight = 0, edgesUsed = 0;
    for (int[] edge : edges) {
        if (uf.union(edge[0], edge[1])) {       // true if this didn't merge an existing cycle
            totalWeight += edge[2];
            if (++edgesUsed == V - 1) break;      // spanning tree complete
        }
    }
    return totalWeight;
}
```

> **Interview lens:** Kruskal's vs Prim's is another density-driven choice,
> structurally identical to the adjacency-list-vs-matrix decision from the
> previous chapter: sparse graphs favor Kruskal's (dominated by an O(E log
> E) sort), dense graphs favor Prim's (dominated by O(E log V) heap
> operations, which pays off better when E approaches V²).

## Key takeaways

- BFS's shortest-path guarantee requires uniform edge cost; Dijkstra
  generalizes it by replacing the plain queue with a min-heap ordered by
  distance — the same algorithm, adapted for weighted edges.
- Dijkstra assumes popped distances are final, which negative edge weights
  violate silently — no error, just a wrong answer. Bellman-Ford (slower,
  O(V·E)) is correct there; know the boundary, not just the pseudocode.
- Minimum spanning tree algorithms (Kruskal's, Prim's) are rare, provably-
  correct instances of greedy algorithms — solving "connect everything for
  minimum total cost," the literal shape of network/infrastructure design.
- Kruskal's vs Prim's is the same density trade-off as adjacency list vs
  matrix: sparse graphs favor Kruskal's (edge-sort dominated), dense graphs
  favor Prim's (heap-operation dominated).
