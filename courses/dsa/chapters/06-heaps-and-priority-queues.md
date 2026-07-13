---
id: dsa-06
title: Heaps and Priority Queues
minutes: 14
level: senior
---

A heap answers one question extremely well: "what's the min (or max) of
this collection, right now, and what happens when that changes?" That's a
narrower contract than a sorted structure — and that narrowness is exactly
what makes heaps faster than full sorting for the large class of problems
that only ever need the extreme, not the full order.

## The invariant, and why an array can hold a tree

A binary heap is a complete binary tree (every level full except possibly
the last, filled left-to-right) satisfying the **heap property**: every
parent is ≤ both children (min-heap) or ≥ both children (max-heap). Note
what it does *not* guarantee: siblings and cousins have no defined order
relative to each other — a heap is much weaker than a BST, and that
weakness is the source of its speed.

Because the tree is always complete, it can be stored in a plain array with
no pointers at all — parent/child relationships are pure arithmetic:

```java
// For a node at index i (0-based):
int parent(int i)     { return (i - 1) / 2; }
int leftChild(int i)  { return 2 * i + 1; }
int rightChild(int i) { return 2 * i + 2; }
```

This is chapter 1's argument returned with interest: a heap gets a tree's
logarithmic height *and* an array's cache locality and zero pointer
overhead, because "complete binary tree" is regular enough to need no
explicit structure at all.

## Why insert and extract-min are both O(log n)

- **Insert**: append to the array's end (the next open slot in the
  complete tree), then **sift up** — swap with the parent while the heap
  property is violated. At most `height` swaps, so O(log n).
- **Extract-min**: the root is always the minimum by the heap property, so
  reading it is O(1). Removing it is the interesting part: move the *last*
  element into the root position (keeps the tree complete), then **sift
  down** — swap with the smaller child while violated. Again O(log n).

```java
void siftUp(int[] heap, int i) {
    while (i > 0 && heap[parent(i)] > heap[i]) {
        swap(heap, i, parent(i));
        i = parent(i);
    }
}

void siftDown(int[] heap, int i, int size) {
    int smallest = i;
    int l = leftChild(i), r = rightChild(i);
    if (l < size && heap[l] < heap[smallest]) smallest = l;
    if (r < size && heap[r] < heap[smallest]) smallest = r;
    if (smallest != i) { swap(heap, i, smallest); siftDown(heap, smallest, size); }
}
```

Crucially: **finding the min is O(1), but finding an arbitrary element is
O(n)** — a heap has no invariant that helps you search for a value that
isn't the current extreme. This is the precise contract trade a heap makes,
and confusing "heap" with "sorted structure" is the most common heap
mistake in interviews and code review alike.

> **Interview lens:** "Can a heap tell you the second-smallest element in
> O(1)?" — no. The second-smallest is one of the root's two children, but
> which one requires an O(1) comparison of exactly two candidates, not a
> free lookup; and the *third*-smallest requires examining more candidates
> still. Knowing precisely what a heap does and doesn't guarantee is the
> signal that separates real understanding from pattern-matched heap usage.

## Building a heap from scratch: O(n), not O(n log n)

Naively inserting n elements one at a time costs O(n log n). But `heapify`
— converting an already-populated array into a valid heap in place — runs
in **O(n)**, by sifting down from the last non-leaf node backward to the
root:

```java
void heapify(int[] arr) {
    for (int i = arr.length / 2 - 1; i >= 0; i--) {
        siftDown(arr, i, arr.length);
    }
}
```

The O(n) bound (not O(n log n)) surprises most people, and the proof is
worth internalizing: most nodes are near the *bottom* of the tree, where
sift-down does very little work — only the O(log n) nodes near the *root*
do substantial work, and summing the (decreasing) work across all levels
converges to O(n) total, not O(n log n). This is exactly why
`Collections.sort`-then-heap approaches are needlessly expensive compared
to `PriorityQueue`'s O(n) bulk-construction from an existing collection.

> **Trade-off:** If you need a heap built once from a fixed collection,
> `heapify` (O(n)) beats n individual inserts (O(n log n)). If elements
> arrive over time, individual inserts are the only option anyway — know
> which situation you're in before reaching for either.

## Priority queues: the interface a heap usually serves

In practice, you rarely implement a raw heap — you reach for
`java.util.PriorityQueue`, which is heap-backed and exposes exactly the
narrow contract a heap actually offers: `offer` (insert), `poll`
(extract-min), `peek` (read min). The **top-K problem** family is the
clearest illustration of why this narrow contract is enough:

```java
// Top-K largest elements from a huge stream, using O(k) memory
int[] topKLargest(int[] stream, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();  // min at top
    for (int x : stream) {
        minHeap.offer(x);
        if (minHeap.size() > k) minHeap.poll();  // evict the current smallest
    }
    return minHeap.stream().mapToInt(i -> i).toArray();
}
```

Sorting the whole stream to find the top K is O(n log n) and O(n) memory.
This runs in O(n log k) time and **O(k)** memory — for k ≪ n (a common
real shape: "top 10 trending items out of 50 million events"), that memory
difference is the entire reason the approach is viable at all.

> **Interview lens:** "Find the K largest elements in a stream you can't
> hold in memory" is a heap question wearing a streaming-systems costume.
> The insight to name explicitly: a **min-heap of size k** tracks "the
> current top-K" with O(1) access to the weakest member of that set (the
> one to evict when a bigger element arrives) — the min-heap, not a
> max-heap, is the correct choice precisely because you need to find and
> discard the *smallest* of your current best-k.

## Key takeaways

- A heap's invariant is weaker than a BST's — parent ≤ children, with no
  sibling ordering — which is exactly what makes O(1) min-access and
  O(log n) insert/extract cheap; it cannot search for arbitrary values in
  better than O(n).
- Complete-tree structure means a heap is stored as a plain array, no
  pointers — parent/child indices are pure arithmetic, inheriting array
  cache locality on top of tree-shaped logarithmic operations.
- Building a heap from an existing array (`heapify`) is O(n), not
  O(n log n) — cheaper than n individual inserts when the whole
  collection is known upfront.
- The top-K-from-a-stream pattern is the canonical heap use case: a
  min-heap capped at size k tracks the current top-K in O(n log k) time
  and O(k) memory, versus O(n log n) time and O(n) memory to sort
  everything.
