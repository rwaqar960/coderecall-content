---
id: dsa-01
title: Arrays, Strings, and Memory Layout
minutes: 15
level: senior
---

Every developer knows arrays give O(1) indexed access. Fewer can explain
*why* — and the why is what separates "I memorized Big-O" from "I understand
what the machine is actually doing." That understanding is what lets you
predict which "equivalent" O(n) solution will be 5x faster in production.

## Why O(1) access is a hardware fact, not just a math fact

An array is a single contiguous block of memory. `arr[i]` compiles to
`base_address + i * element_size` — one multiply, one add, no traversal.
That's the whole trick. A linked list's `O(1)` insert looks equally cheap on
paper, but chasing a pointer to get there is a **memory fetch to an
unpredictable address**, which is where the real cost hides.

> **Interview lens:** "Why is array access O(1) but linked list access
> O(n)?" is a screener question. The answer that separates candidates:
> arrays compute an address; lists must *dereference* their way there, and
> dereferencing an unpredictable address is where cache misses live.

## Cache locality: the complexity class that Big-O doesn't show

Modern CPUs are fast; RAM is comparatively slow. A cache miss can cost
**100-300x** more cycles than a cache hit. Big-O counts operations, not
cycles — so two O(n) algorithms can differ by an order of magnitude in wall
time, purely based on memory access pattern.

```java
// Same O(n) complexity, very different real-world speed:
int sumArray(int[] arr) {
    int sum = 0;
    for (int x : arr) sum += x;      // sequential reads: cache prefetcher
    return sum;                       // loads the next several elements
}                                      // before you ask for them

int sumLinkedList(Node head) {
    int sum = 0;
    for (Node n = head; n != null; n = n.next) sum += n.val;
    return sum;                       // each n.next may live anywhere in
}                                      // heap memory: prefetcher can't help
```

For large collections, `sumArray` can run several times faster than
`sumLinkedList` despite identical asymptotic complexity. This is why modern
standard libraries default to array-backed structures (`ArrayList`,
`std::vector`, Python `list`) even where a linked list seems like the
"natural" fit — **contiguous memory usually wins until proven otherwise.**

> **Trade-off:** Big-O analysis assumes uniform-cost memory access. Real
> hardware doesn't work that way. For senior-level reasoning, treat Big-O as
> a first filter, not the final answer — the constant factor from cache
> behavior routinely dominates at real-world sizes.

## Dynamic arrays: amortized O(1), not O(1)

`ArrayList.add` is documented as "amortized constant time" — a phrase every
senior engineer should be able to derive, not just recite. When a dynamic
array's backing store fills up, it allocates a new array (typically
**1.5x-2x** larger), copies every element, then continues. That copy is
O(n) — but it happens rarely enough that the *average* cost per insertion,
over many insertions, is O(1).

```
capacity:  4 → 8 → 16 → 32 → ...   (doubling)
copies:    4   8   16   32          elements moved at each resize
inserts:   4   8   16   32          inserts since the previous resize
```

The total copying work across n inserts sums to a geometric series
(4+8+16+...+n ≈ 2n), so total work is O(n) for n inserts — O(1) amortized
per insert. **The growth factor matters**: doubling wastes up to 50% memory
but keeps resizes rare (O(log n) of them); growing by a fixed amount (e.g.
+10) keeps memory tight but degrades to O(n) amortized cost, since resizes
now happen O(n) times.

> **Interview lens:** "Is `ArrayList.add` O(1)?" — the precise answer is
> "amortized O(1); any *individual* call can be O(n) during a resize." This
> distinction matters for latency-sensitive systems: amortized-fast doesn't
> mean uniformly-fast, and a resize landing on a critical request path is a
> real, recurring production incident (the fix: pre-size collections with a
> known or estimated capacity when the size is predictable).

## Strings: immutability's performance tax, and its point

Java, Python, and JavaScript strings are immutable — every "modification"
allocates a new string. Concatenating in a loop is the classic trap:

```java
String result = "";
for (String s : parts) {
    result = result + s;   // O(n) new allocation, every iteration
}                           // total: O(n^2) for n parts
```

Each `+` allocates a new string and copies both operands into it. Over n
iterations of growing size, total work is O(n²). The fix uses a **mutable
builder**, confining mutation locally and publishing an immutable result —
the same escape-hatch pattern as any immutable value type:

```java
StringBuilder sb = new StringBuilder();
for (String s : parts) sb.append(s);   // amortized O(1) per append
String result = sb.toString();          // total: O(n)
```

> **Trade-off:** String immutability isn't a performance oversight — it's
> the same trade discussed for value objects generally: safe hashing
> (strings as map keys), safe sharing across threads, and safe use as
> dictionary/interning keys, at the cost of naive concatenation being
> quadratic. Know the cost, use the builder, keep the safety.

## Two-pointer and sliding-window: array patterns that show up everywhere

Because array access is O(1) in both directions, two index variables
scanning toward or alongside each other solve a large fraction of
array/string interview problems in O(n) with O(1) extra space — a mechanical
upgrade over an O(n²) nested-loop instinct:

```java
// Two pointers, opposite ends: is this palindrome-shaped?
boolean isPalindrome(char[] s) {
    int lo = 0, hi = s.length - 1;
    while (lo < hi) {
        if (s[lo] != s[hi]) return false;
        lo++; hi--;
    }
    return true;
}

// Sliding window: longest substring with no repeated characters
int longestUnique(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        while (window.contains(s.charAt(right))) {
            window.remove(s.charAt(left++));   // shrink from the left
        }
        window.add(s.charAt(right));
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

The recognizable signal: a nested loop where the inner loop's start point
only ever moves *forward* — that monotonicity is what collapses O(n²) to
O(n), because each pointer traverses the array at most once in total.

## Key takeaways

- Array O(1) access is address arithmetic; linked structures pay a
  dereference cost Big-O doesn't capture — cache locality is a real,
  large constant factor, not a rounding error.
- Dynamic array growth is **amortized** O(1); any single insert can be
  O(n). Pre-size when the count is predictable; know the growth factor's
  memory-vs-resize-frequency trade-off.
- String immutability makes naive loop concatenation O(n²) — use a
  builder to confine mutation locally, same pattern as any value type.
- Two-pointer/sliding-window patterns turn many O(n²) array problems into
  O(n) by exploiting monotonic pointer movement — recognize the shape.
