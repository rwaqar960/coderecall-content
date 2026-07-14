---
id: flutter-09
title: "App Architecture: Layers and Boundaries"
minutes: 16
level: staff
---

The OOP course's capstone argued that at scale, boundary quality dominates
object quality — mediocre code behind a clean boundary ages better than
elegant code leaking across a sloppy one. This chapter is that argument
applied specifically to Flutter, where the natural gravity (business
logic quietly accumulating inside `build()` methods, because that's where
the data already is) makes the boundary genuinely easy to lose without
noticing.

## The default gravity, and why it's a problem

Nothing stops a Flutter developer from writing API calls, validation
logic, and business rules directly inside a widget's `build()` method or
a `State` class — it compiles, it runs, and for a small app it's
indistinguishable from a well-architected one. The cost shows up later,
and it's the same cost chapter 8 named for testing: logic entangled with
widgets can only be exercised by rendering those widgets, and it can only
change alongside whatever UI change happens to touch that file — chapter
9 of the OOP course's "anemic model industrialized" argument, mirrored
here as "business logic industrialized into presentation code."

```dart
// Business logic (discount eligibility) living inside a widget
class CheckoutState extends State<Checkout> {
  double _total = 0;

  void _applyPromo(String code) {
    if (code == 'SAVE10' && _total > 50) {   // business rule, buried here
      setState(() => _total *= 0.9);
    }
  }
}
```

Nothing here is *wrong* syntactically. It's wrong architecturally: the
promo-eligibility rule can't be unit tested without building a widget,
can't be reused if a second screen needs the same rule, and changes to
it show up as a diff in a UI file, obscuring what actually changed for
reviewers.

## The layered shape: UI, domain, data

The standard fix separates three concerns, each depending only on the
layer beneath it — a direct application of the OOP course's dependency-
direction principle (arrows point from volatile to stable):

- **UI layer** (widgets): renders state, forwards user actions. Volatile
  — changes with every design tweak — and depends on the domain layer.
- **Domain layer** (plain Dart classes/functions: business logic, use
  cases): the promo rule, pricing calculations, validation — pure logic,
  no Flutter imports at all, meaning it's unit-testable with zero
  framework overhead (chapter 8's fastest tier, by construction).
- **Data layer** (repositories): fetches and persists data, wrapping
  whatever the actual source is (a REST API, a local database, platform
  channels) behind an interface the domain layer depends on — the OOP
  course's DIP applied directly: the domain layer defines what it needs,
  the data layer implements it, never the reverse.

```dart
// Domain: pure Dart, no Flutter import, unit-testable in milliseconds
class PromoService {
  bool isEligible(String code, double total) =>
      code == 'SAVE10' && total > 50;
}

// UI: only orchestrates — no business rule lives here anymore
class CheckoutState extends State<Checkout> {
  final _promoService = PromoService();

  void _applyPromo(String code) {
    if (_promoService.isEligible(code, _total)) {
      setState(() => _total *= 0.9);
    }
  }
}
```

The promo rule is now testable in isolation, reusable from any screen,
and its diffs read as domain changes, not UI changes — the exact payoff
chapter 8 promised for logic kept separate from widgets.

## Repository pattern: the data layer's actual job

A repository's job is narrower than "talk to the API" — it's **hiding
where data actually comes from** behind an interface the domain layer can
depend on without knowing or caring:

```dart
abstract class OrderRepository {
  Future<Order> fetchOrder(String id);
}

class ApiOrderRepository implements OrderRepository {
  @override
  Future<Order> fetchOrder(String id) async { /* real HTTP call */ }
}

class FakeOrderRepository implements OrderRepository {
  @override
  Future<Order> fetchOrder(String id) async => Order.sample();  // for tests
}
```

This is precisely chapter 6 of the OOP course's dependency inversion:
the domain layer depends on `OrderRepository` (an interface it owns
conceptually), and a test substitutes `FakeOrderRepository` with zero
network calls, zero widget tree, and zero platform channel involvement —
the fastest possible test for logic that would otherwise require mocking
an HTTP client or standing up a test server.

> **Interview lens:** "How would you structure a Flutter app so business
> logic can be unit tested?" — the strong answer names the layering
> explicitly (UI depends on domain, domain depends on repository
> interfaces, data layer implements them) rather than a vague "separate
> concerns" — and explains *why* each dependency direction is chosen, not
> just that layers exist.

## The honest cost, and when it's not worth paying

> **Trade-off:** This structure is real overhead for a small app or a
> genuine prototype — interfaces, multiple files, and indirection for
> logic that might never need to be reused or tested in isolation. The
> same "don't abstract before the second occurrence" discipline from the
> algorithms course applies: a five-screen internal tool with no complex
> business rules doesn't need three layers: it needs working code. The
> layering earns its cost specifically when business logic is genuinely
> non-trivial, needs to be tested without a widget tree, or needs to be
> shared across more than one screen — not as a default template applied
> to every Flutter project regardless of size.

## Key takeaways

- Flutter's default gravity pulls business logic into widgets, because
  that's where the data already is — this compiles fine and is
  architecturally wrong, for exactly the reasons chapter 9 of the OOP
  course named for anemic-model-adjacent industrialized logic.
- The layered fix: UI (volatile, depends on domain), domain (pure Dart,
  no Flutter import, unit-testable for free), data/repositories (hide the
  real data source behind an interface the domain layer depends on).
- The repository pattern is dependency inversion, directly: domain code
  depends on an interface it conceptually owns; a fake implementation
  substitutes in tests with zero network/widget/platform overhead.
- This architecture is a real cost (files, indirection, interfaces) that
  only pays for itself once business logic is non-trivial, needs
  isolated testing, or needs reuse across screens — not a default
  template for every project regardless of actual complexity.
