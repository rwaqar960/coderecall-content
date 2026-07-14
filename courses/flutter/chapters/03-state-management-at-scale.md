---
id: flutter-03
title: State Management at Scale
minutes: 16
level: senior
---

"Provider vs Riverpod vs Bloc" debates generate enormous heat and little
useful signal, because they're usually fought at the wrong altitude —
feature checklists instead of what each library actually trades away.
Since chapter 2 established they all sit on the same `InheritedWidget`
foundation, the real comparison is about what each one adds, and what
that addition costs.

## The axis that actually matters: where does state live, relative to widgets?

Every state management approach makes a choice along one spectrum: how
tightly is state's lifetime coupled to the widget tree's lifetime?

- **Widget-coupled** (plain `setState`, `InheritedWidget`): state lives
  inside a State object, dies when the widget is removed from the tree.
  Simple, but state can't outlive its widget, and can't be reached from
  outside the widget tree (a background service, a test harness) without
  extra plumbing.
- **Tree-independent** (Bloc, Riverpod's providers, most "store"
  patterns): state lives in an object that exists independently of any
  widget, and widgets merely subscribe to it. Survives widget disposal,
  testable without building any widget tree at all, but now requires an
  explicit lifecycle story — who creates it, who disposes it, and when.

This is the actual decision, and it's a real trade-off, not a maturity
ladder — "tree-independent" isn't strictly better, it's a different
allocation of complexity: simpler widgets, more explicit lifecycle
management elsewhere.

## Provider: InheritedWidget's ergonomics, mostly unchanged model

Provider is close to a direct ergonomic wrapper over `InheritedWidget` —
same widget-coupled-by-default model, but with less boilerplate and
composable providers:

```dart
ChangeNotifierProvider(
  create: (_) => CartModel(),
  child: const MyApp(),
)

// consuming, anywhere below:
final cart = context.watch<CartModel>();  // rebuilds on notifyListeners()
```

`ChangeNotifier` (a small, standard-library-adjacent class with
`notifyListeners()`) is Provider's default state-holder — mutable,
listener-based, close to `setState`'s mental model but reachable across
the sibling problem chapter 2 described. This closeness to the mental
model most Flutter developers already have is Provider's actual value
proposition: low conceptual jump, real ergonomic win, same underlying
mutability trade-offs as any listener-based mutable object.

## Riverpod: the same idea, decoupled from BuildContext

Riverpod's core change from Provider: providers are declared **outside**
the widget tree entirely (as top-level or static objects), and
`BuildContext` is no longer required to read them:

```dart
final cartProvider = ChangeNotifierProvider((ref) => CartModel());

// in a widget:
final cart = ref.watch(cartProvider);
// in a test, or a background isolate, with no widget tree at all:
final container = ProviderContainer();
final cart = container.read(cartProvider);
```

This solves two concrete problems Provider has: **compile-time safety**
(Provider's `context.watch` call for a given model type throws at runtime
if no matching provider exists above in the tree; Riverpod's `cartProvider` reference is
checked at compile time — a typo or a missing provider is a compile
error, not a runtime crash discovered by a user) and **testability
without a widget tree** (reading a provider's value doesn't require
`pumpWidget`-ing anything). The cost: a steeper initial learning curve
and a genuinely different mental model (`ref` instead of `context`) for
teams already fluent in Provider or plain `setState`.

## Bloc: state transitions as an explicit, testable contract

Bloc goes further in a different direction — not just decoupling storage
from the widget tree, but making **state transitions themselves** an
explicit, named, testable sequence: events go in, states come out, and
the mapping between them is the entire unit under test.

```dart
sealed class CartEvent {}
class ItemAdded extends CartEvent { final Item item; ItemAdded(this.item); }

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(CartState.empty()) {
    on<ItemAdded>((event, emit) => emit(state.withItem(event.item)));
  }
}
```

This is the OOP course's sealed-types-for-a-closed-set pattern (chapter
2) applied directly to state transitions — the event hierarchy is closed
and exhaustive, so adding a new event type is a compile-time-checked
decision, not a runtime surprise. The cost is real ceremony: every state
change requires defining an event, a handler, and reasoning about the
state machine explicitly — a heavier tool that earns its keep on complex,
multi-step flows (checkout, multi-page forms, anything with real business
rules about valid transitions) and is genuine overkill for "is this
checkbox checked."

> **Interview lens:** "When would you choose Bloc over Provider?" — the
> strong answer names the actual trade: Bloc's ceremony buys an explicit,
> testable state machine — worth it when the *transitions* themselves
> have business rules to enforce; wasted when state is simple data with
> no meaningful transition logic.

## Choosing: the framework this course keeps returning to

The same discipline the DSA course closed with — name the actual
requirement, then match the tool to it, not the reverse:

1. **Does this state need to survive its widget, or be reached from
   outside the tree** (background sync, tests without a UI)? If no,
   `setState` or a local `InheritedWidget` is enough — reaching further
   adds cost with no corresponding benefit.
2. **Is the team already fluent in one of these models?** Provider's
   closeness to `setState`'s mental model is a real, non-technical
   advantage for teams adopting Flutter — Riverpod's compile-time safety
   is a real technical advantage that costs a steeper ramp.
3. **Do state *transitions* themselves have rules worth enforcing
   explicitly** (can't checkout with an empty cart, can't submit a form
   mid-validation)? That's Bloc's actual sweet spot, not "the app is
   large."

> **Trade-off:** "Large app" alone doesn't determine the right choice —
> a large app with simple, independent pieces of state is well served by
> Provider or Riverpod used consistently; a small app with one genuinely
> complex, rule-heavy flow (a multi-step checkout) can legitimately use
> Bloc for just that flow and something simpler everywhere else. Mixing
> approaches by actual need, not by picking one library for the whole app
> on day one, is a defensible senior-level call.

## Key takeaways

- The real axis is widget-coupled vs. tree-independent state lifetime —
  not a maturity ladder, a genuine trade-off between simplicity and
  reachability/testability.
- Provider is close to `InheritedWidget`'s existing model with less
  boilerplate — low conceptual jump, real ergonomic win.
- Riverpod decouples providers from `BuildContext` entirely, trading a
  steeper learning curve for compile-time safety and testability without
  a widget tree.
- Bloc makes state *transitions* an explicit, closed, testable contract
  (events in, states out) — genuine ceremony that earns its keep for
  complex, rule-heavy flows and is overkill for simple state.
- Choose by matching the actual requirement (reachability need, team
  fluency, transition complexity) — including mixing approaches within
  one app for genuinely different needs, rather than picking one library
  for everything upfront.
