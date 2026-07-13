---
id: oop-06
title: ISP and DIP in Practice
minutes: 15
level: senior
---

The last two SOLID principles are where architecture starts: the Interface
Segregation Principle decides how wide your contracts are, and the
Dependency Inversion Principle decides which direction your dependencies
point. Together they determine whether your core logic can outlive its
frameworks, databases, and vendors.

## ISP: clients define interfaces, not implementations

The formal statement — "no client should be forced to depend on methods it
does not use" — hides the practical insight: **interfaces belong to the
code that calls them**, not to the classes that implement them.

The smell, in every large codebase:

```java
interface UserRepository {
    User findById(UserId id);
    List<User> search(Query q);
    void save(User u);
    void delete(UserId id);
    void bulkImport(Stream<User> users);
    Stats computeStats();          // added for the admin dashboard
}
```

The password-reset flow needs `findById` and `save`. But it depends on all
seven methods: its tests need a mock with seven stubs, any signature change
anywhere recompiles it, and nothing in the type system says "this flow only
reads and saves." Fat interfaces also breed LSP violations — implementations
that can't support `bulkImport` start throwing `UnsupportedOperationException`
(chapter 4's smell, root-caused).

Segregated, from the *clients'* point of view:

```java
interface UserReader  { User findById(UserId id); }
interface UserWriter  { void save(User u); }

class PasswordResetService {
    PasswordResetService(UserReader reader, UserWriter writer) { ... }
}
```

Now the signature documents true dependencies, the mock is two methods, and
a read-only replica can implement `UserReader` honestly. One class can still
implement all the slices (`class SqlUserRepository implements UserReader,
UserWriter, ...`) — segregation is about the *consumption* side.

> **Trade-off:** Slice along real client boundaries, not per method.
> Reader/writer, or per-use-case role interfaces, usually carve at the
> joints. Twenty single-method interfaces for one repository is ISP theater:
> ceremony without a client that benefits.

## DIP: the direction of the arrows

DIP says: **high-level policy should not depend on low-level detail; both
should depend on abstractions.** The word *inversion* is literal — it
reverses the "natural" direction where business logic imports the database
library.

```
Without DIP:   OrderService ──► PostgresOrderStore ──► JDBC
                (policy imports detail; database changes ripple upward)

With DIP:      OrderService ──► OrderStore ◄── PostgresOrderStore
                (policy owns the interface; detail implements it)
```

The crucial, most-missed point: **the abstraction belongs to the high-level
module.** `OrderStore` is defined in the domain package, written in domain
vocabulary (`save(Order)`, not `executeUpdate(sql)`). The Postgres adapter
imports *the domain*, never the reverse. That single arrow direction is the
whole of hexagonal/clean architecture; ports-and-adapters is DIP applied at
package scale.

> **Interview lens:** "You use dependency injection, so you follow DIP,
> right?" is a trap. DI is a *wiring mechanism*; DIP is about *who owns the
> abstraction*. Injecting a `PostgresOrderStore` concrete class is DI
> without DIP. Defining `OrderStore` in your domain and injecting whatever
> implements it is both.

What DIP buys, concretely:

- **Testability** — the service tests with an in-memory `OrderStore`; no
  containers, no test database, millisecond suites.
- **Deferred decisions** — the team builds and demos order logic before
  choosing Postgres vs Dynamo; the adapter arrives last.
- **Vendor mobility** — swapping the payment provider means writing one
  adapter, not chasing SDK types through the codebase.

## Where NOT to invert

DIP has a hype failure mode: interfaces for everything, including things
that will never vary and are not I/O.

- **Stable, universal utilities** — inverting your dependency on `String`,
  collections, or the standard clock API (beyond a `Clock` for testability)
  is noise.
- **Within a single cohesive module**, two classes collaborating privately
  don't need an interface between them; DIP guards *boundaries*, not every
  constructor.
- **When the abstraction leaks anyway** — an `OrderStore` with
  `beginTransaction()`, `flushBatch()`, and `hintIndex()` is Postgres
  wearing a fake mustache. If the domain interface can only be written in
  detail vocabulary, the inversion is fictional.

The honest test: *could a second, meaningfully different implementation
exist?* In-memory-for-tests counts — that's the one abstraction almost every
I/O boundary earns.

## Key takeaways

- ISP: interfaces are owned by **clients**; depend only on what you call.
  Fat interfaces cause over-broad coupling, seven-stub mocks, and
  `UnsupportedOperationException` subtypes.
- Slice interfaces along real client roles (reader/writer, per use case) —
  not one method each.
- DIP: policy owns the abstraction, details implement it. The domain never
  imports the adapter.
- Dependency *injection* is plumbing; dependency *inversion* is ownership of
  the interface. You can have either without the other.
- Invert at boundaries (I/O, vendors, volatility); don't interface-wrap
  stable utilities or intra-module collaborators.
