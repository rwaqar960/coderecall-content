---
id: swift-05
title: Generics, some, and any
minutes: 17
level: senior
---

Swift generics look like generics in any other statically-typed language
until you hit protocols with associated types — at which point Swift
introduces two keywords, `some` and `any`, that don't exist elsewhere and
that confuse nearly everyone the first time. This chapter builds the model
that makes them obvious rather than arbitrary.

## Ordinary generics

A generic function or type is parameterized over a type, with optional
constraints. The compiler generates specialized, type-safe code per usage —
no boxing, no casting.

```swift
func firstOrNil<T>(_ items: [T]) -> T? {
    items.isEmpty ? nil : items[0]
}

func maxOf<T: Comparable>(_ a: T, _ b: T) -> T {
    a > b ? a : b
}
```

The constraint (a type that is comparable) is what lets the body use the
greater-than operator: the compiler knows every `T` here supports it. This
is standard fare and rarely the source of confusion.

## The problem: protocols with associated types can't be used as plain types

Recall from chapter 3 that a protocol with an associated type has no single
concrete shape — a "container" protocol doesn't say *what* it contains. So
you cannot write a variable whose type is just that protocol; the compiler
doesn't know enough to lay it out. Historically this produced the dreaded
"can only be used as a generic constraint" error. `some` and `any` are the
two answers to "then how do I refer to one?"

## some — an opaque type, one specific concrete type hidden from the caller

`some Protocol` means: *there is exactly one concrete type here, chosen by
the implementation, and I'm not telling you which.* The caller gets full
type identity guarantees (two values of the same opaque type are the same
type) but can't see the underlying type name. It's a reverse generic — the
callee picks the type, not the caller.

```swift
func makeCollection() -> some Collection {
    [1, 2, 3]          // concrete type is [Int], hidden behind `some Collection`
}
```

This is what powers SwiftUI's `some View`: a view's `body` returns one
specific, compiler-known concrete type (often a deeply nested generic
soup), and `some View` lets you write the signature without spelling that
type out — while preserving the performance of a fully static type.

## any — an existential box, could be any conforming type at runtime

`any Protocol` means: *any conforming type, boxed so different concrete
types can be stored together.* This restores the "heterogeneous list"
ability at the cost of a layer of indirection (the existential container)
and dynamic dispatch.

```swift
let shapes: [any Shape] = [Circle(), Square(), Triangle()]  // mixed concrete types
```

The one-line mental model: **`some` = one hidden concrete type (static,
fast, single); `any` = a box that could hold different types (dynamic,
flexible, heterogeneous).** Reach for `some` when there's really only one
type and you just don't want to name it; reach for `any` when you genuinely
need to mix different conforming types in one place.

## Why the distinction is enforced now

Before Swift 5.7, `any` was implicit — writing a bare protocol name gave
you an existential silently, and people paid its runtime cost without
realizing. Making `any` explicit was a deliberate move to surface that cost
at the point you opt into it, the same philosophy behind making force-
unwrap visible. When you see `any` in a signature, someone accepted dynamic
dispatch on purpose.

> **Interview lens:** "What's the difference between `some View` and
> `any View`?" A strong answer names three axes: identity (`some` is one
> fixed type, `any` erases it), performance (`some` is static dispatch,
> `any` boxes and dispatches dynamically), and use case (`some` for a single
> hidden return type, `any` for heterogeneous storage). Getting only "one is
> opaque" is a partial answer.

## The performance framing that makes it click

Generics and `some` are resolved at compile time — the compiler can inline
and specialize, so there's no per-call overhead. `any` defers the type to
runtime, which means a box, possibly a heap allocation, and indirect calls.
None of this is "slow" in absolute terms, but on a hot path the difference
is real, and choosing `any` for a collection you iterate millions of times
is a mistake a profiler will find.

> **Trade-off:** `any` is more flexible and sometimes genuinely necessary
> (heterogeneous collections, type erasure at API boundaries). The skill is
> not avoiding it dogmatically but reaching for `some` or a generic
> parameter first, and spending `any`'s cost only where the flexibility is
> actually used.
