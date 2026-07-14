---
id: flutter-07
title: Platform Channels and Native Integration
minutes: 14
level: senior
---

Flutter renders its own UI, in its own engine, independent of the native
platform's widget toolkit — which is *why* it looks identical on iOS and
Android, and also *why* it can't simply "call" native platform code the
way a native app would. Every crossing between Dart and native code goes
through one narrow, well-defined bridge. Understanding its shape explains
both what's easy and what's genuinely hard about native integration.

## Why there's a bridge at all

Flutter doesn't use the platform's native UI components — it paints
everything itself via Skia (or Impeller, its successor), running in the
Dart VM. This is the entire reason Flutter achieves pixel-identical
rendering across platforms, and it has a direct consequence: **Dart code
and native platform code run in separate runtimes**, with no shared
memory or direct call mechanism between them. Anything Dart needs from
the platform — camera access, native sensors, platform-specific APIs —
has to cross that boundary explicitly.

## MethodChannel: request/response across the boundary

The most common bridge mechanism, `MethodChannel`, is deliberately
simple: Dart sends a method name and arguments, native code (Kotlin/Java
on Android, Swift/Objective-C on iOS) handles it and sends back a result
— serialized across the boundary as **platform-standard types only**
(numbers, strings, booleans, lists, maps — no arbitrary objects).

```dart
// Dart side
const channel = MethodChannel('com.example.app/battery');
final level = await channel.invokeMethod<int>('getBatteryLevel');
```

```kotlin
// Android side (Kotlin)
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.example.app/battery")
    .setMethodCallHandler { call, result ->
        if (call.method == "getBatteryLevel") {
            result.success(getBatteryLevel())
        }
    }
```

The serialization constraint (platform-standard types only) is not a
minor inconvenience — it's the direct consequence of the two runtimes
sharing no memory. You cannot pass a Dart object reference to native
code; you can only pass data that both sides know how to encode and
decode identically.

> **Interview lens:** "Why can't Flutter just call native code directly,
> the way Kotlin can call Java?" — the strong answer names the actual
> constraint: separate runtimes, no shared memory, hence a message-passing
> bridge with serializable-only payloads — not "Flutter is a JavaScript-
> like sandboxed thing" (it isn't; Dart compiles to native machine code)
> but specifically a two-runtime boundary.

## EventChannel: the streaming variant

`MethodChannel` is request/response — Dart asks, native answers once.
Continuous data (accelerometer readings, location updates, battery-level
changes over time) needs the streaming counterpart, `EventChannel`, which
exposes a native-side event source as a Dart `Stream`:

```dart
const channel = EventChannel('com.example.app/accelerometer');
channel.receiveBroadcastStream().listen((event) {
  // fires repeatedly, as native events arrive
});
```

Same underlying message-passing mechanism, same serialization constraint
— `EventChannel` is really `MethodChannel`'s handshake (start listening,
stop listening) plus a way for native code to push messages back
whenever it has one, rather than only in response to a Dart-initiated
call.

## Isolates: Dart's own concurrency boundary, for a different reason

A separate but related concept: Dart is **single-threaded per isolate** —
there's no shared-memory multithreading within Dart code itself. A
long-running, CPU-heavy Dart computation (parsing a huge JSON payload,
image processing) blocks the UI thread's event loop exactly like a
synchronous native call would, causing dropped frames — **not because of
the platform channel boundary**, but because Dart's own concurrency model
has no free-threading escape hatch.

```dart
// Blocks the UI isolate for the whole computation — frames drop
final result = expensiveParse(hugeJsonString);

// Runs on a separate isolate — UI isolate stays responsive
final result = await compute(expensiveParse, hugeJsonString);
```

`compute` spins up a separate isolate (its own memory, its own event
loop — genuinely separate, not a shared-memory thread) runs the function
there, and returns the result via message-passing, the same fundamental
pattern as platform channels: **isolates, like platform boundaries,
communicate only by serializable messages, never shared references** —
which is why the function passed to `compute` must be a top-level or
static function, not a closure capturing local state that can't be
serialized across the isolate boundary.

> **Trade-off:** Reaching for `compute`/isolates for every async
> operation is unnecessary and adds real overhead (isolate spin-up cost,
> serialization of the input/output) — genuinely CPU-bound work (heavy
> parsing, image manipulation) benefits; ordinary I/O-bound async work
> (network calls, file reads) is already non-blocking via Dart's event
> loop and gains nothing from an isolate.

## Key takeaways

- Flutter paints its own UI (via Skia/Impeller) rather than using native
  platform widgets — the reason for both its cross-platform consistency
  and the existence of a narrow Dart-native bridge for anything the
  platform must provide.
- `MethodChannel` is request/response, serializing only platform-standard
  types (no object references) across the boundary, because Dart and
  native code share no memory.
- `EventChannel` is the streaming counterpart — same message-passing
  mechanism, exposed as a Dart `Stream` for continuous native-side events.
- Dart is single-threaded per isolate; CPU-heavy synchronous work blocks
  the UI event loop regardless of platform channels — `compute` runs work
  on a separate isolate via the same serializable-message-passing pattern.
- Reserve isolates for genuinely CPU-bound work — ordinary async I/O is
  already non-blocking and gains nothing from the added isolate overhead.
