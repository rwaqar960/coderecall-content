---
id: dsa-10
title: Choosing Data Structures Under Real Constraints
minutes: 17
level: staff
---

Nine chapters have each made the case for a structure by showing where it
wins. Production systems don't hand you a labeled problem — they hand you
requirements, and picking wrong is expensive to unwind after the fact. This
capstone is the decision framework: the questions to ask, in order, before
writing a single line, and what happens when you skip them.

## The framework: four questions, asked in order

**1. What operation happens most often, and what's its target
complexity?** Not "what operations are supported" — what's actually on the
hot path. A structure that's O(log n) for everything is often worse in
practice than one that's O(1) for the common case and O(n) for a rare one.

**2. What's the actual data shape — size, and mutation pattern?** Read-
heavy vs write-heavy changes the answer (chapter 5's AVL-vs-red-black
trade-off exists entirely because of this axis). Bounded vs unbounded size
changes it too (a heap capped at size k, chapter 6, only works because k is
known and small).

**3. What are the concurrency and memory constraints?** A structure that's
asymptotically ideal but requires locking on every operation may lose to a
"worse" structure that partitions cleanly across threads. A structure that
needs O(V²) memory (chapter 7's adjacency matrix) is disqualified outright
past a certain scale, regardless of its query speed.

**4. What does "wrong" cost — silent or loud?** Chapter 8's Dijkstra-with-
negative-weights is the sharpest example in this course: picking wrong
there doesn't crash, it silently returns an incorrect answer. A structure
choice that fails loudly (an exception, an OOM) is far cheaper than one
that fails quietly — weight this into the decision, not just raw
performance.

> **Interview lens:** "Design X" questions are testing this framework, not
> a specific memorized structure. Walking through these four questions
> out loud — even arriving at a "boring" answer like a plain HashMap — beats
> jumping straight to a clever structure that doesn't actually fit the
> stated constraints.

## Worked example: rate limiter

"Design a rate limiter: at most N requests per user per rolling 60-second
window." Walking the framework:

1. **Hot operation**: "is this request allowed?" — checked on *every*
   request, must be fast (ideally O(1) or O(log N)).
2. **Data shape**: per-user, small bounded count (N is typically small —
   tens to low hundreds), read-and-write on every request, values expire
   naturally with time.
3. **Constraints**: this runs per-request in a hot path across possibly
   many servers — memory per user must stay tiny, and if distributed,
   sharing state has its own cost (chapter 2's consistent hashing is
   exactly how you'd shard this across nodes).
4. **Failure cost**: getting this wrong either lets abuse through (loud
   enough to notice, eventually) or wrongly blocks legitimate users (a
   real, quieter cost — support tickets, not alarms).

The fit: a **deque of timestamps per user** (chapter 4) — push the new
request's timestamp, pop expired ones off the front (older than 60s), the
remaining count is the answer. O(1) amortized per request, memory bounded
by N per user (never grows past the window), and the "pop expired from
front, push new to back" shape is exactly what a deque is for. Notice what
this *isn't*: a heap (no need for arbitrary min/max, just FIFO expiry), a
tree (no ordering query needed), a trie (no prefix structure here at all).
The correct structure fell directly out of the actual access pattern, not
from a list of "structures I know."

## Worked example: autocomplete

"Design search-box autocomplete for a product catalog." Walking the
framework:

1. **Hot operation**: "give me the top suggestions for this prefix,"
   fired on every keystroke — must be very fast, ideally proportional to
   prefix length, not catalog size.
2. **Data shape**: a large, mostly-static catalog (rewritten rarely,
   read constantly) with heavy prefix overlap (many products share word
   prefixes) — the shared-prefix property chapter 9 named as a trie's
   actual advantage condition.
3. **Constraints**: read-heavy, latency-sensitive, can tolerate
   eventual consistency (a new product doesn't need to appear in
   autocomplete within milliseconds).
4. **Failure cost**: quiet and low-stakes — a missing suggestion is a
   minor UX gap, not a correctness bug.

The fit: a **trie**, exactly chapter 9's use case — prefix query in
O(prefix length), and the catalog's real prefix-sharing (colors, brands,
categories repeating across products) is what makes the memory trade-off
pay off, not just "trie exists for strings."

## The trap: choosing by familiarity, not fit

The single most common structural mistake at senior level isn't picking a
*bad* structure — it's picking a **default** one reflexively (usually
`HashMap` or `ArrayList`) without checking whether the actual access
pattern needs something else. A few concrete tells that the default is
wrong:

- Reaching for `HashMap` when you repeatedly need the *minimum* or
  *maximum* key — that's chapter 6's heap, hiding behind a structure that
  can't answer the question in better than O(n).
- Reaching for a `List` and linear-scanning for membership checks — that's
  chapter 2's hash set, a one-line change from O(n) to O(1) per check.
- Reaching for a graph traversal (BFS/DFS) inside a loop, re-answering
  "connected?" from scratch each time — that's chapter 9's union-find,
  turning a repeated O(V+E) into a repeated near-O(1).
- Reaching for a sorted structure (TreeMap) when you only ever need the
  current extreme, never a range — that's over-paying O(log n) for
  something a heap gives you at O(1) read.

> **Trade-off:** None of this means "always use the fancy structure."
> Chapter 1 opened this course arguing arrays beat linked lists more often
> than intuition suggests; chapter 5 showed a plain BST outperforms a
> self-balancing one when insertion order is guaranteed random. The
> discipline isn't "prefer sophisticated structures" — it's "let the actual
> operation and shape decide," which sometimes means the boring answer *is*
> correct, and sometimes means it very much isn't.

## Key takeaways

- Ask, in order: what's the hot operation, what's the data's actual shape
  and mutation pattern, what are the concurrency/memory constraints, and
  what does getting it wrong cost — silent or loud.
- Silent failure (Dijkstra with negative weights, a stale hash bucket) is
  more dangerous than loud failure (an exception) — weight this
  explicitly, not just raw speed.
- Worked example discipline: name the hot operation first, then let the
  structure follow from it — a rate limiter's deque and autocomplete's
  trie both fall directly out of their access pattern, not from a
  memorized list of "structures for strings" or "structures for counts."
- The most common structural mistake is reflexive default use (HashMap,
  ArrayList, a sorted tree) without checking whether the real access
  pattern needs a heap, a hash set, or union-find instead — and,
  symmetrically, not every situation needs the fancier structure; this
  course's own chapters showed both directions.
