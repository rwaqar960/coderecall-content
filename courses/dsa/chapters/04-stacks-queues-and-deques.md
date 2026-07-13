---
id: dsa-04
title: Stacks, Queues, and Deques
minutes: 13
level: senior
---

Stacks and queues look like the simplest structures in this course — push,
pop, enqueue, dequeue. What's actually worth senior-level attention is where
they show up *unnamed*: the call stack underneath every recursive function,
the monotonic-stack trick that turns O(n²) scans into O(n), and the deque
that quietly generalizes both.

## The call stack is a stack, and that has real consequences

Every function call pushes a frame (return address, local variables, saved
registers); returning pops it. Recursion is just this mechanism used
explicitly — which means **recursion depth is bounded by stack size**, a
fixed, comparatively small memory region (often ~1MB per thread by default
in the JVM). A correct, O(n)-time recursive function can still crash in
production with `StackOverflowError` on large enough input, purely from
depth, independent of the algorithm's asymptotic complexity being fine.

```java
// Correct algorithm, O(n) time — but O(n) STACK DEPTH too
int sumTo(int n) {
    if (n == 0) return 0;
    return n + sumTo(n - 1);   // n recursive frames alive simultaneously
}
```

Two standard fixes: convert to an explicit loop with your own stack
(`ArrayDeque` standing in for the call stack, giving you heap-sized capacity
instead of the fixed stack region), or restructure as tail recursion — which
Java, notably, **does not optimize**, unlike Scala or functional languages
with guaranteed tail-call elimination. This is a JVM-specific fact worth
knowing before assuming a "tail-recursive" rewrite actually fixes anything
in Java.

> **Interview lens:** "Convert this recursive function to iterative" is
> rarely about style — it's testing whether you know recursion has a real,
> finite memory budget. Explaining *why* (stack depth, frame size) is the
> senior-level answer; producing the iterative code is just the mechanical
> follow-through.

## Stacks: LIFO, and the balanced-structure family of problems

A stack's discipline — last in, first out — is the natural fit for any
problem with a **nesting** structure: matched parentheses, undo history,
DFS traversal (explicit stack instead of recursion), and expression
evaluation.

```java
boolean isBalanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) stack.push(c);
        else if (pairs.containsKey(c)) {
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
        }
    }
    return stack.isEmpty();
}
```

Note the idiom: `ArrayDeque` is used *as* a stack here (`push`/`pop`), not
`Stack` — Java's actual `java.util.Stack` class is a legacy, synchronized
`Vector` subclass, slower and API-inconsistent with the rest of the
collections framework. `ArrayDeque` is the modern, correct default for
stack usage in Java, same as it is for queue usage.

## Monotonic stacks: the pattern that collapses O(n²) into O(n)

A large class of "for each element, find the next/previous element that is
greater/smaller" problems looks like it needs a nested loop — O(n²) — but
collapses to O(n) with a **monotonic stack**: a stack kept in strictly
increasing (or decreasing) order by popping anything that violates the
order before pushing.

```java
// Next greater element for each position, O(n) total
int[] nextGreater(int[] nums) {
    int[] result = new int[nums.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();   // holds indices
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];        // found this index's answer
        }
        stack.push(i);
    }
    return result;
}
```

The O(n) bound holds because **each index is pushed once and popped at
most once**, across the entire run — the nested `while` doesn't add extra
total work, it just redistributes it. This exact shape underlies "daily
temperatures," "largest rectangle in histogram," and stock-span problems;
recognizing the *pattern* (not memorizing each problem) is the transferable
skill.

> **Interview lens:** The tell that a problem wants a monotonic stack:
> "next/previous greater/smaller element" phrasing, or anything where an
> element's answer depends on the nearest not-yet-resolved neighbor in one
> direction. Naming the pattern by name, unprompted, signals real pattern
> recognition rather than a memorized solution.

## Queues, and the deque that generalizes everything

A queue's FIFO discipline fits problems with a **fairness/ordering**
requirement — BFS traversal, task scheduling, rate limiting (a sliding
window of recent request timestamps). A **deque** (double-ended queue)
generalizes both stack and queue by allowing push/pop at *both* ends in
O(1), which is why `ArrayDeque` is the standard modern choice for
implementing either:

```java
Deque<Integer> asStack = new ArrayDeque<>();
asStack.push(1); asStack.pop();       // LIFO via one end

Deque<Integer> asQueue = new ArrayDeque<>();
asQueue.offer(1); asQueue.poll();     // FIFO via opposite ends
```

A less obvious deque use: the **sliding window maximum** problem (maximum
of every k-sized window as it slides across an array) uses a deque holding
*candidate indices* in decreasing value order — pushed from the back,
expired (out-of-window) indices popped from the front, dominated (smaller)
values popped from the back before inserting — achieving O(n) total for
what looks like it needs O(n·k).

> **Trade-off:** Implementing a queue with two stacks (push onto one,
> transfer to the other for pops) is a classic exercise showing amortized
> O(1) queue operations from stack primitives — elegant, and a genuinely
> asked interview question, but not something you'd reach for in production
> Java where `ArrayDeque` already exists and is simpler and faster.

## Key takeaways

- The call stack is a real, size-bounded stack — deep recursion can
  overflow it even when the algorithm's time/space complexity looks fine
  on paper; Java does not optimize tail calls.
- `ArrayDeque` is the modern, correct default for both stack and queue use
  in Java — not `Stack` (legacy, synchronized) or `LinkedList` (worse cache
  behavior, per chapter 3).
- Monotonic stacks turn "next/previous greater/smaller element" problems
  from O(n²) to O(n) by ensuring each element is pushed and popped at most
  once across the whole run — recognize the phrasing, not just the code.
- Deques generalize stack and queue, and unlock patterns like sliding-window
  maximum that neither pure stack nor pure queue solves cleanly alone.
