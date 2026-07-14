---
id: kotlin-10
title: Kotlin Interop and Multiplatform Considerations
minutes: 16
level: staff
---

Kotlin was designed for interoperability from day one — with the JVM's
existing Java ecosystem, and more recently with iOS/native and web via
Kotlin Multiplatform. This capstone is about the seams: where Kotlin's
guarantees (null safety, chapter 1; structured concurrency, chapter 5)
hold completely, where they degrade at a boundary, and how to make good
judgment calls at exactly those edges.

## Platform types, precisely: the boundary chapter 1 flagged

Chapter 1 named platform types as null safety's real limitation. The
practical discipline at a Java boundary:

```kotlin
// Java: public String getName() { return name; }  <- may or may not be null

// Kotlin, calling it:
val name = javaObject.getName()   // platform type — Kotlin trusts you, unchecked
val safeName: String? = javaObject.getName()   // explicitly nullable: honest
val certainName: String = javaObject.getName()  // explicitly non-null: a bet
```

The discipline: **explicitly annotate the nullability you're assuming**,
rather than letting a platform type silently propagate as an unverified
assumption through more of the codebase. Declaring it `String?` costs a
few extra characters and forces downstream code to actually handle the
maybe-null case; declaring it `String` is a bet that should be backed by
real knowledge of the Java API's contract (documentation, `@Nullable`/
`@NotNull` annotations if the Java code has them — which Kotlin *does*
read and honor, converting an annotated Java API's platform types into
real, enforced Kotlin nullability automatically).

## Checked exceptions: Kotlin doesn't have them, Java does

Java's checked exceptions are compiler-enforced (a method's signature
must declare them, or callers must handle them); Kotlin has no such
concept — all exceptions are unchecked from Kotlin's perspective, even
ones thrown by Java code with a `throws` clause.

```kotlin
// Java: void readFile() throws IOException { ... }

fun loadConfig() {
    javaFileReader.readFile()   // Kotlin doesn't require a try/catch — silently
}                                // ignoring a checked exception Java would enforce
```

This is a real, easy-to-miss gap: Kotlin code calling a Java method that
declares checked exceptions compiles fine with **no** enforcement,
because Kotlin's compiler doesn't track checked exceptions at all — the
IDE may warn, but the language doesn't require anything. The discipline
is knowing this gap exists and deliberately checking Java API
documentation for `throws` clauses that Kotlin's compiler won't surface
on its own.

## `@JvmStatic`, `@JvmOverloads`, and why they exist

Kotlin's `companion object` functions and default-parameter functions
don't compile to what Java code expects by default — calling them from
Java is awkward without help:

```kotlin
class Config {
    companion object {
        @JvmStatic fun default() = Config()   // without @JvmStatic: Java sees Config.Companion.default()
    }

    @JvmOverloads
    fun connect(timeout: Int = 30, retries: Int = 3) { }
    // without @JvmOverloads: Java sees only the one full-parameter-list overload
}
```

These annotations exist entirely for the **Java-calling-Kotlin**
direction — Kotlin code never needs them, since Kotlin already
understands companions and default parameters natively. This is worth
knowing precisely because it clarifies when they're actually needed: a
Kotlin library with Java consumers benefits from them; a Kotlin-only
codebase gets no value from adding them defensively.

## Kotlin Multiplatform: sharing logic, not sharing everything

Kotlin Multiplatform (KMP) lets a single Kotlin codebase target JVM/
Android, iOS/native, and web/JS — but not uniformly. The idiomatic
split, and why it exists:

- **`commonMain`**: platform-independent business logic (the domain layer
  from the Flutter course's architecture chapter, restated for KMP) —
  pure Kotlin, no platform-specific APIs.
- **`expect`/`actual`**: a `commonMain` declaration marked `expect`
  states "every platform must provide this," and each platform's source
  set supplies an `actual` implementation — the mechanism for genuinely
  platform-specific needs (secure storage, native UI hooks) without
  breaking the shared code's compilability.

```kotlin
// commonMain
expect fun currentTimeMillis(): Long

// androidMain
actual fun currentTimeMillis(): Long = System.currentTimeMillis()

// iosMain
actual fun currentTimeMillis(): Long = NSDate().timeIntervalSince1970.toLong() * 1000
```

> **Trade-off:** KMP's honest scope is sharing **logic** (validation,
> business rules, data models, networking) — not UI, which each platform
> typically still owns natively (Compose Multiplatform is changing this
> for some UI cases, but the chapter 9 Flutter-course architecture
> lesson applies directly here too: the *domain* layer is what's
> naturally platform-independent, and forcing UI code to be shared when
> platform-specific UX genuinely differs fights the grain rather than
> working with it).

## The judgment call this capstone is actually about

Every interop or multiplatform decision in this chapter reduces to the
same question this course has asked repeatedly: **where does a
guarantee actually hold, and where does it stop?** Null safety stops at
unannotated Java. Exception-checking never existed in Kotlin to begin
with. `expect`/`actual` exists precisely because shared code's
guarantees stop being about *behavior* and start being about *contract*
the moment a platform-specific need appears. Recognizing the boundary —
not being surprised by it later — is the actual senior-level skill this
whole course has been building toward.

## Key takeaways

- Platform types are null safety's real edge — explicitly annotate the
  nullability you're assuming from Java rather than letting an unverified
  platform type propagate silently; Kotlin honors Java's `@Nullable`/
  `@NotNull` annotations automatically when present.
- Kotlin has no checked exceptions — calling Java code with `throws`
  clauses compiles with zero enforcement; know this gap exists and check
  Java API documentation deliberately, since the compiler won't.
- `@JvmStatic`/`@JvmOverloads` exist solely for Java-calling-Kotlin
  ergonomics — a Kotlin-only codebase gains nothing from adding them.
- Kotlin Multiplatform's `expect`/`actual` shares platform-independent
  logic while allowing genuinely platform-specific implementations —
  KMP's honest scope is sharing logic, not forcing UI (which differs
  legitimately per platform) into a single shared shape.
- Every seam in this chapter is the same question: where does a Kotlin
  guarantee actually hold, and where does it stop — recognizing that
  boundary in advance, not discovering it via a production bug, is the
  actual skill.
