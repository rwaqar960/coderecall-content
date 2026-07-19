---
id: swift-04
title: Protocol Extensions and the Static/Dynamic Dispatch Trap
minutes: 16
level: senior
---

Protocol extensions are how Swift delivers shared behavior without a base
class — you attach default implementations to a protocol, and every
conformer gets them for free. They're powerful and idiomatic. They also
contain one of the most reliably surprising behaviors in the language: a
method can dispatch *statically* based on the type you're looking through,
not the actual object. Understanding exactly when this happens is a
frequent senior/staff interview probe because it separates people who've
been bitten from people who haven't.

## Default implementations

An extension on a protocol can provide a body for a requirement, or add
entirely new methods not listed in the protocol:

```swift
protocol Greeter {
    func greeting() -> String
}

extension Greeter {
    func greeting() -> String { "Hello" }   // default
    func greetLoudly() -> String { greeting().uppercased() + "!" }  // bonus method
}

struct Formal: Greeter {
    func greeting() -> String { "Good evening" }   // overrides the default
}
```

So far this behaves how you'd expect. The trap appears with the *bonus*
methods — the ones declared only in the extension, not in the protocol.

## The dispatch rule that surprises everyone

- A method that is a **protocol requirement** (listed in the protocol body)
  uses **dynamic dispatch**: the conformer's implementation wins, even when
  called through the protocol type.
- A method that exists **only in the extension** (not a requirement) uses
  **static dispatch**: which implementation runs is decided by the *type of
  the reference*, at compile time.

```swift
protocol Describable {
    func kind() -> String          // a requirement
}
extension Describable {
    func kind() -> String { "generic" }
    func label() -> String { "unlabeled" }   // NOT a requirement — extension-only
}

struct Widget: Describable {
    func kind() -> String { "widget" }        // overrides requirement
    func label() -> String { "shiny widget" } // "overrides"? — see below
}

let w = Widget()
let d: Describable = w

print(w.kind())   // "widget"  — dynamic, conformer wins
print(d.kind())   // "widget"  — dynamic, conformer STILL wins
print(w.label())  // "shiny widget" — static, Widget's own type
print(d.label())  // "unlabeled"    — static, chosen by the Describable reference!
```

The last line is the bug factory. Looking at the *same object* through a
`Describable` reference calls the extension's `label()`, not `Widget`'s,
because `label()` isn't a protocol requirement and so the call is resolved
against the reference's static type. Nothing is "overridden" at all — the
two `label()` methods are independent, and which one you get depends on
where you're standing.

## Why it works this way

Protocol extensions aren't part of the protocol's dynamic dispatch table
(its witness table) unless the method is a declared requirement. Extension-
only methods are ordinary statically-dispatched functions that happen to be
in scope for conforming types. This is a deliberate performance and
predictability choice, not a bug — but it violates the "the real object's
method always wins" intuition that inheritance trained into most engineers.

> **Interview lens:** Being handed this exact four-line puzzle and
> explaining *why* `d.label()` prints the extension version — "it's not a
> protocol requirement, so it's statically dispatched against the
> `Describable` type" — is a classic Swift senior-screen question. The tell
> of a strong answer is naming the requirement-vs-extension distinction, not
> just observing that it's "weird."

## The fix, and the habit

If you want a method to be overridable through the protocol type, **declare
it as a protocol requirement.** The extension can still provide a default;
being listed in the protocol body is what moves it into dynamic dispatch.

```swift
protocol Describable {
    func kind() -> String
    func label() -> String   // now a requirement → dynamic dispatch
}
```

The practical habit: if a protocol extension method is meant to be
customizable per conformer, it must appear in the protocol declaration, not
only the extension. Extension-only methods should be genuinely non-
customizable helpers (like `greetLoudly()` above) where static dispatch is
fine and even desirable.

> **Trade-off:** Making everything a requirement to be safe reintroduces
> ceremony and gives up the performance of static dispatch for helpers that
> never needed to be overridden. The judgment is intent: "customization
> point" → requirement; "internal convenience built on the customization
> points" → extension-only is correct.
