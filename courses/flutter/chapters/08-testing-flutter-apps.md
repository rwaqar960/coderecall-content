---
id: flutter-08
title: Testing Flutter Apps
minutes: 14
level: senior
---

Flutter ships three distinct testing tools — unit, widget, and integration
— and the most common testing mistake isn't skipping tests, it's using
the wrong one for the question being asked. Each tool answers a different
question at a different cost, and matching them correctly is worth more
than raw coverage percentage.

## Unit tests: pure logic, no framework at all

A unit test in Flutter is identical in spirit to a unit test anywhere:
call a function or method, assert on the result, no widgets, no rendering,
no framework involved.

```dart
test('applies percentage discount correctly', () {
  final price = Money(100, 'USD');
  expect(applyDiscount(price, 0.2), Money(80, 'USD'));
});
```

This is the fastest, cheapest tier — milliseconds per test, no simulated
device or rendering pipeline — which makes it the right tool for anything
that's pure logic: pricing calculations, data transformations, validation
rules. The chapter 9 architecture discussion is directly relevant here:
**business logic kept separate from widgets is unit-testable**; business
logic entangled inside a widget's `build()` method forces every test of
that logic through the much more expensive widget-testing tier, whether
the logic actually needs rendering or not.

## Widget tests: rendering, without a real device

A widget test builds a widget (or a small tree) into an in-memory test
environment, simulates interaction, and asserts on the resulting widget
tree — no real device or emulator, no actual screen, but real widget
lifecycle (`build`, `setState`, rebuilds) executing for real.

```dart
testWidgets('tapping increments the counter', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: CounterScreen()));
  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();   // rebuild after the tap's setState

  expect(find.text('1'), findsOneWidget);
});
```

The `pump()` call is not a formality — it's the test's explicit request
for a frame to be processed, mirroring chapter 1's point that a
`setState` schedules a rebuild rather than performing one immediately.
Forgetting `pump()` after an action that triggers `setState` is the
single most common widget-test mistake: the assertion runs against the
*pre-rebuild* tree, and the test fails (or worse, passes by accident)
for reasons unrelated to the actual behavior being tested.

> **Interview lens:** "Why did you call `pump()` twice here?" (once for
> the initial frame, once after an action) is a legitimate probe for
> whether a candidate understands that widget tests execute Flutter's
> real frame-scheduling model, not just "run the code and check the
> result" — the same asynchronous-rebuild reality from chapter 1, made
> explicit and controllable in a test.

## Integration tests: the real thing, slow and expensive

Integration tests run the **actual compiled app** on a real or simulated
device, driving it exactly as a user would — genuinely testing what ships,
including platform channel calls, real navigation, real rendering. This
is also why they're orders of magnitude slower than widget tests
(seconds-to-minutes per test, versus milliseconds) and the most fragile
tier (timing-dependent, environment-dependent, the first tests to flake
under CI load).

> **Trade-off:** The testing pyramid's shape — many unit tests, fewer
> widget tests, very few integration tests — isn't a style preference,
> it's a direct consequence of the cost and fragility gradient across the
> three tiers. Inverting it (few unit tests, heavy reliance on slow,
> flaky integration tests to catch logic bugs) is a common, expensive
> mistake: the same bug that a millisecond unit test would catch
> instantly instead surfaces in a multi-minute integration run, often
> flakily, far later in the feedback loop.

## Golden tests: pixel-level regression detection

A **golden test** renders a widget and compares the resulting pixels
against a saved reference image, catching *visual* regressions that
logic-focused widget tests structurally cannot — a padding value that
silently changes, a color that regresses, a layout that shifts by a few
pixels on one platform.

```dart
testWidgets('product card matches golden', (tester) async {
  await tester.pumpWidget(const ProductCard(item: sampleItem));
  await expectLater(
    find.byType(ProductCard),
    matchesGoldenFile('goldens/product_card.png'),
  );
});
```

The honest cost: golden images are platform- and font-rendering-sensitive
(a golden generated on one OS/Flutter version can fail on another for
reasons unrelated to an actual regression), and reviewing a failed golden
diff requires visually inspecting an image, not reading an assertion
message — genuinely useful for a design system's core components, real
maintenance overhead if applied indiscriminately across every screen.

## What to test at each tier: a practical allocation

1. **Unit test**: anything that's pure logic and doesn't need a widget
   tree to exercise — the majority of a well-architected app's actual
   business rules (chapter 9).
2. **Widget test**: a screen or component's interactive behavior — does
   tapping this button produce this state change, does this form validate
   correctly — without needing the overhead of a real device.
3. **Integration test**: sparingly, for genuinely cross-cutting flows that
   only manifest end-to-end (a full checkout flow spanning several
   screens, a deep link actually opening the right screen) — not as a
   substitute for the cheaper tiers.
4. **Golden test**: for visually load-bearing, reused components (a
   design system's button, card, or input styles) where a silent visual
   regression is a real, recurring risk worth the maintenance cost.

## Key takeaways

- Unit tests (pure logic, no framework) are the fastest, cheapest tier —
  and only usable for logic that's actually separated from widgets, which
  is chapter 9's architecture payoff made concrete.
- Widget tests exercise real widget lifecycle in-memory; `pump()` is an
  explicit request to process a frame after an action, and forgetting it
  after a `setState`-triggering interaction is the most common widget-test
  mistake.
- Integration tests run the real compiled app and are the slowest, most
  fragile tier — reserve them for genuinely cross-cutting, end-to-end
  flows, not as a substitute for cheaper, more targeted tests.
- The testing pyramid's shape (many unit, fewer widget, very few
  integration) follows directly from the cost/fragility gradient —
  inverting it is a common, expensive mistake.
- Golden tests catch visual regressions no logic-focused test can —
  genuinely valuable for reused, visually load-bearing components; real
  maintenance overhead (platform sensitivity, manual diff review) if
  applied everywhere indiscriminately.
