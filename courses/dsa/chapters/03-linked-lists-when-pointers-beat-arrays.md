---
id: dsa-03
title: "Linked Lists: When Pointers Beat Arrays"
minutes: 14
level: senior
---

Chapter 1 made the case *against* linked lists on cache grounds. This
chapter is the other half of the argument: the specific, real situations
where a linked list is genuinely the right call — and the senior-level
skill of recognizing which situation you're in, rather than defaulting to
either structure by habit.

## What a linked list actually buys you

The one guarantee an array structurally cannot make: **O(1) insertion and
deletion given a reference to the node**, with no shifting of other
elements and no resize-copy. An array insertion at position i must shift
every element after i — O(n) — regardless of how the array is implemented.

```java
class Node<T> { T val; Node<T> next; }

// O(1): no shifting, just pointer rewiring
void insertAfter(Node<T> prev, T val) {
    Node<T> node = new Node<>();
    node.val = val;
    node.next = prev.next;
    prev.next = node;
}
```

This is genuinely valuable when you already hold a reference to the
insertion point — an iterator mid-traversal, a cursor in a text editor, a
node you just visited in a graph search — and don't want to pay for
shifting or re-finding that position.

## Sentinel nodes: deleting a whole category of edge cases

The most common linked-list bug is special-casing the head: "if this is
the first node, update the head pointer instead of the previous node's
`next`." A **sentinel (dummy) node** — a placeholder node that always
exists before the real head — removes the special case entirely by making
*every* real node have a "previous" to update:

```java
// Without sentinel: head deletion is a special case
Node removeValue(Node head, int val) {
    if (head != null && head.val == val) return head.next;  // special case
    Node prev = head;
    while (prev != null && prev.next != null) {
        if (prev.next.val == val) { prev.next = prev.next.next; return head; }
        prev = prev.next;
    }
    return head;
}

// With sentinel: no special case, one uniform loop
Node removeValueSentinel(Node head, int val) {
    Node sentinel = new Node(); sentinel.next = head;
    Node prev = sentinel;
    while (prev.next != null) {
        if (prev.next.val == val) prev.next = prev.next.next;
        else prev = prev.next;
    }
    return sentinel.next;
}
```

> **Interview lens:** Using a sentinel/dummy head unprompted is a strong
> signal in a linked-list interview — it shows you've internalized *why*
> head-of-list bugs happen (an asymmetry between "the head" and "every
> other node"), not just memorized the pattern.

## Floyd's cycle detection: two pointers, one insight

Detecting a cycle in a linked list without extra memory is the canonical
"two pointers moving at different speeds" problem — and it generalizes far
beyond linked lists (the same idea detects cycles in functional graphs,
finds duplicate numbers in a bounded array, and underlies some
pseudorandom-number-generator period detection).

```java
boolean hasCycle(Node head) {
    Node slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;   // they've met: a cycle exists
    }
    return false;                         // fast hit the end: no cycle
}
```

If a cycle exists, the fast pointer (moving 2 steps) is guaranteed to lap
the slow pointer (moving 1 step) within the cycle's length — they cannot
skip past each other, because each step only closes the gap by one. If no
cycle exists, `fast` simply reaches the end first. O(n) time, O(1) space —
the space bound is the entire point (a hash-set-of-visited-nodes approach
also detects cycles, but at O(n) space).

> **Trade-off:** Floyd's algorithm is more memory-efficient but harder to
> read and reason about than "put visited nodes in a HashSet." For
> interview settings, know both; for production code, prefer the
> HashSet version unless the memory bound is actually load-bearing —
> readability wins when the O(n) space isn't a real constraint.

## The honest counter-case: why "just use an array" often still wins

Even for workloads that sound linked-list-shaped, arrays frequently win in
practice:

- **A "queue of pending tasks with frequent removal from the middle"**
  sounds like a linked list's job — but if removal is by *value search*
  rather than by an already-held node reference, you pay O(n) to *find* the
  node either way, so the array's better cache behavior wins outright.
- **Java's own `LinkedList`** is a doubly-linked list and is measurably
  slower than `ArrayList` for nearly every access pattern except "insert
  given a live iterator at that position" — which is why `ArrayDeque` (an
  array-backed ring buffer) is the recommended default for stack/queue use
  in Java, not `LinkedList`, despite the name suggesting otherwise.

> **Interview lens:** "When would you use a linked list over an array in
> real code?" — the strong answer names the *specific* shape: frequent
> insertion/deletion at a position you already hold a reference to, where
> you don't need random access and the collection is large enough that
> shifting would matter. Anything vaguer than that is the "linked lists are
> just better for insertion" myth this chapter is correcting.

## Key takeaways

- A linked list's real advantage is O(1) insert/delete **given a held
  reference to the position** — not general-purpose insertion, which still
  requires O(n) to *find* that position by value.
- Sentinel nodes eliminate head-of-list special-casing by ensuring every
  real node has a uniform "previous" to update.
- Floyd's cycle detection (slow/fast pointers) finds cycles in O(1) space;
  a HashSet of visited nodes does the same in O(n) space but is easier to
  read — pick based on whether the space bound is load-bearing.
- In practice, arrays (and array-backed structures like `ArrayDeque`) beat
  linked lists for most real workloads, including several that sound
  linked-list-shaped on first read — cache locality from chapter 1 usually
  wins unless you specifically need reference-based O(1) splicing.
