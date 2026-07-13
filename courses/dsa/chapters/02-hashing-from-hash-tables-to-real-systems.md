---
id: dsa-02
title: "Hashing: From Hash Tables to Real Systems"
minutes: 16
level: senior
---

`HashMap.get()` in O(1) feels like magic until you've had to explain *why*
it's O(1), what makes it degrade, and why that degradation is a real
production incident category, not a theoretical footnote. Hashing is also
the clearest bridge in this course back to encapsulation and immutability —
get those contracts wrong and the "O(1)" data structure silently becomes
O(n).

## The mechanism: bucket by hash, resolve collisions

A hash table is an array of **buckets**. `hashCode()` maps a key to an
integer; that integer, modulo the array size, picks a bucket. Two different
keys landing in the same bucket is a **collision**, resolved one of two
ways:

- **Chaining** — each bucket holds a small list (or, in modern JDKs, a
  balanced tree once a bucket gets large) of entries. Lookups scan the
  bucket's list, so worst case degrades toward the list's length.
- **Open addressing** — on collision, probe another slot in the same array
  (linear, quadratic, or double hashing) until an empty one is found. No
  extra list, but the whole table is one contiguous structure — sensitive to
  **clustering** as it fills up.

Java's `HashMap` uses chaining, with a notable optimization added in Java 8:
if a single bucket's chain grows past a threshold (8 entries), it converts
that bucket from a linked list to a red-black tree, capping worst-case
lookup at O(log n) instead of O(n) for that bucket — a direct, shipped
example of chapter 5's "trees for balance" paying for itself in infrastructure
code, not just interview problems.

## Load factor and resizing: the other amortized O(1)

A hash table's **load factor** (entries ÷ bucket count) governs collision
frequency. Java's `HashMap` resizes (doubles bucket count, rehashes every
entry) once load factor exceeds 0.75. This is structurally identical to
dynamic array resizing from chapter 1: individual `put` calls are O(1), but
a resize is O(n), averaging out to amortized O(1) — **and knowing the
expected final size lets you pre-size the map** (`new HashMap<>(expectedSize
* 4/3)`) to skip resizes entirely, exactly as you'd pre-size an ArrayList.

> **Interview lens:** "Why is HashMap O(1)?" — the complete answer names
> three things: the bucket-index arithmetic, the average bucket chain
> length staying short under a good hash function, and the amortized cost
> of periodic resizing. Missing any one is an incomplete answer.

## When O(1) quietly becomes O(n): the contract violation

Chapter 1 of the OOP course established that a mutable object placed in a
`HashSet` and then mutated corrupts the collection — this is the mechanism
made precise. `hashCode()` must be **consistent** with the object's current
state; if a key's hash-relevant fields change after insertion, the entry is
now filed under a stale bucket index and becomes unreachable via `get`
even though `equals` would still say it matches.

The second, more common way O(1) silently degrades: a **poor hash
function**. If every key collides into the same bucket (a bad or malicious
`hashCode()` returning a constant, or user-controlled string keys crafted to
collide — a genuine, exploited denial-of-service vector called a **hash
flooding attack**), every operation degrades to O(n), and the whole map
behaves like a linked list wearing a hash table's API. This is precisely why
modern `HashMap` implementations added the chaining-to-tree fallback: it
caps the *worst case* even under adversarial or pathological key
distributions.

> **Trade-off:** A hash function that's expensive to compute but spreads
> keys perfectly wastes CPU on every single operation; a cheap function that
> clusters wastes correctness under load. Standard library hash functions
> (Java's `Objects.hash`, well-designed `hashCode` overrides using a prime
> multiplier) are tuned for this balance — resist the urge to hand-roll one
> without a specific, measured reason.

## Hashing for identity: the equals/hashCode contract, precisely

Three rules, and violating any one causes collections to misbehave in ways
that pass code review and fail in production:

1. **Consistency**: equal objects *must* have equal hash codes.
   (The reverse isn't required — unequal objects may share a hash code;
   that's just a collision, handled by bucket resolution.)
2. **Stability**: an object's hash code must not change while it's a key in
   a live hash-based collection — the mutability argument from chapter 7 of
   OOP, restated as a hard rule rather than a style preference.
3. **Both or neither**: overriding `equals` without `hashCode` (or vice
   versa) breaks rule 1 by construction — this is why IDEs and linters flag
   it, and why records/data classes generate both together automatically.

```java
class BadKey {
    int id;
    @Override public boolean equals(Object o) {
        return o instanceof BadKey && ((BadKey) o).id == id;
    }
    // no hashCode override: inherits Object's identity-based hash
}
// Two BadKey instances with the same id are equal() but have different
// hashCode()s — they'll never find each other in a HashMap.
```

## Beyond the interview: hashing as infrastructure

Hashing scales far past single-process maps, and the same core idea —
"turn a key into a deterministic bucket" — reappears at every layer of
distributed systems:

- **Consistent hashing** — used by distributed caches and databases
  (Cassandra, DynamoDB, memcached clusters) to assign keys to nodes so that
  adding/removing a node remaps only a small fraction of keys, instead of
  rehashing everything (the naive `hash(key) % node_count` approach, which
  remaps *nearly all* keys on any node-count change).
- **Bloom filters** — a probabilistic structure built from multiple hash
  functions over a bit array: "definitely not present" is exact, "possibly
  present" has a tunable false-positive rate. Used to avoid expensive
  lookups (disk reads, network calls) for keys that certainly don't exist —
  a staff-level tool for the "check before you fetch" pattern at scale.
- **Content-addressed storage** (git objects, CDN cache keys) — hashing the
  *content itself* as the lookup key, which makes identical content
  automatically deduplicate and any single-bit change produce a completely
  different, verifiable key.

> **Interview lens:** Being asked "how would you design a distributed
> cache?" is, underneath, a hashing question. Naming consistent hashing and
> explaining *why* naive modulo hashing fails under scaling (nearly total
> remapping on node change) is the signal that separates rehearsed system
> design from understood system design.

## Key takeaways

- Hash tables bucket by `hashCode() % size`; collisions resolve via
  chaining (Java's approach, with a tree fallback for long chains) or open
  addressing. Average O(1), not guaranteed O(1).
- Load factor and resizing mirror dynamic arrays exactly: amortized O(1)
  inserts, individual resizes cost O(n). Pre-size when the count is known.
- Mutating a key's hash-relevant fields after insertion corrupts the
  collection silently — the same mutability hazard as chapter 7 of OOP,
  now with a precise mechanism (stale bucket index).
- The equals/hashCode contract has three rules: consistency, stability,
  and "override both or neither." Violating any breaks collections in ways
  that compile and pass casual testing.
- The same idea scales to infrastructure: consistent hashing (distributed
  systems), Bloom filters (probabilistic existence checks), and
  content-addressed storage all reuse "deterministic bucket from a key."
