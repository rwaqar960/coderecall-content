---
id: algo-03
title: Binary Search Beyond Sorted Arrays
minutes: 14
level: senior
---

Binary search is the algorithm every developer "knows" and a disproportionate
number implement incorrectly under pressure — a famous study found most
professional programmers' from-memory binary search implementations had
bugs. The mechanical reason is worth understanding once, properly; the
bigger payoff is recognizing that "sorted array" is only the most familiar
instance of a much more general pattern.

## The real invariant: a monotonic predicate, not a sorted array

Binary search doesn't fundamentally require a sorted array — it requires a
**monotonic predicate**: a yes/no question whose answer is `false` for a
while, then `true` for the rest (or vice versa), over the search space.
"Is `arr[i] >= target`?" over a sorted array is one instance of this; it's
far from the only one.

```java
// The general shape: find the first index where predicate(i) is true,
// given predicate is false...false, true...true (monotonic).
int binarySearchPredicate(int lo, int hi, IntPredicate predicate) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;   // avoids overflow — see below
        if (predicate.test(mid)) {
            hi = mid;       // true region might start earlier; keep mid
        } else {
            lo = mid + 1;   // predicate false at mid; answer is later
        }
    }
    return lo;   // first index where predicate holds
}
```

Once you see search as "shrink a monotonic search space," a large class of
problems that don't *look* like searching reveal themselves as binary
search in disguise.

> **Interview lens:** The strongest signal a candidate understands binary
> search (versus having memorized it) is recognizing this shape in a
> problem that isn't phrased as "search a sorted array" at all — the next
> section is exactly that recognition, formalized.

## "Search on the answer": binary search without a search space in hand

A large family of optimization problems ("minimize the maximum," "find the
smallest value that satisfies a constraint") can be solved by binary
searching over the **range of possible answers**, checking at each
candidate whether it's feasible — even when no array is being searched at
all.

```java
// "Ship packages within D days, minimum possible max daily weight capacity?"
// Search over possible capacities, not over the package array.
int minCapacity(int[] weights, int days) {
    int lo = Arrays.stream(weights).max().getAsInt();  // must fit the heaviest package
    int hi = Arrays.stream(weights).sum();               // one day, everything
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (daysNeeded(weights, mid) <= days) {
            hi = mid;         // mid works; a smaller capacity might too
        } else {
            lo = mid + 1;     // mid isn't enough; need more capacity
        }
    }
    return lo;
}
```

The predicate here — "can this capacity ship everything within `days`
days?" — is monotonic (if capacity C works, any capacity > C also works),
which is the *only* property binary search actually needs. Nothing about
this problem mentions a sorted array; recognizing the monotonic structure
is the entire skill.

> **Trade-off:** Search-on-the-answer trades a direct O(n) or DP solution
> for an O(n log(range)) one — worth it when the answer range is large but
> the per-candidate feasibility check is cheap. If checking feasibility
> itself costs O(n), total cost is O(n log(range)), still often far better
> than a naive approach that doesn't binary search the answer space at all.

## The bugs, precisely

The famous "most binary searches are buggy" finding traces to a small
number of recurring mistakes, worth naming exactly:

- **Integer overflow in the midpoint.** `(lo + hi) / 2` overflows when
  `lo + hi` exceeds the integer range — a real, historical bug (found in
  the JDK's own `Arrays.binarySearch` for years). `lo + (hi - lo) / 2` is
  the safe form.
- **Off-by-one in the loop bound and update.** An inclusive versus
  exclusive loop condition, and `mid` vs `mid ± 1` in the update, must be
  *consistent* with each
  other and with what's being searched for (first true, last false,
  exact match) — mixing conventions from different memorized templates is
  the single most common source of infinite loops or wrong answers.
- **Unclear loop invariant.** The fix for both of the above is stating,
  before writing code, exactly what `lo` and `hi` represent at every
  iteration (e.g., "the answer is always in `[lo, hi]`," or "`predicate`
  is guaranteed false before `lo`, true at and after `hi`") — and then
  writing code that provably maintains it.

> **Interview lens:** Rather than reciting a memorized template, stating
> the loop invariant out loud before coding — and checking each line
> against it — is what actually prevents the classic bugs, and it's a
> visible, verbalizable signal of understanding versus memorization.

## Key takeaways

- Binary search's real requirement is a **monotonic predicate** over a
  search space, not specifically a sorted array — sorted-array search is
  one instance of this more general pattern.
- "Search on the answer" applies binary search to the *range of possible
  answers* to an optimization problem, using a monotonic feasibility check
  — useful even when no array is being searched.
- The classic binary search bugs are: midpoint overflow (`lo + (hi-lo)/2`
  fixes it), inconsistent off-by-one conventions between loop bound and
  update, and coding without first stating the loop invariant.
- Stating the invariant before writing code — not reciting a memorized
  template — is what actually prevents these bugs, and demonstrates real
  understanding in review or an interview.
