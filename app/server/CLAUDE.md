# Java / Spring Boot Backend Conventions

## Tech Stack

- Java 25, Spring Boot 3.5, Spring WebFlux (fully reactive), MongoDB, Maven
- Formatting: Palantir Java Format via `mvn spotless:apply` (auto-runs on pre-commit)

## CE-EE Service Pattern (Mandatory for all extensible components)

### Three-tier inheritance

```text
Interface: ServiceCE            → ServiceCECompatible            → Service
Impl:      ServiceCEImpl        → ServiceCECompatibleImpl        → ServiceImpl (@Service)
Package:   com.x.services.ce      com.x.services.ce_compatible     com.x.services
```

- `@Service` / `@Component` annotation on CE-Compatible and final `*Impl` classes (not on CE base classes)
- Constructor-based DI exclusively (no field injection), use `@RequiredArgsConstructor`
- CE impl contains all business logic; final impl is a pass-through in CE repo
- CE-Compatible: empty pass-through in CE (EE overrides for graceful degradation when license expires)
- Always create the CE-Compatible layer even if no EE override exists yet
- Use `protected` methods in CE impl to create override hooks for EE
- This pattern applies to: services, repositories, controllers, solutions, helpers, configurations, domains, DTOs

## Controller Conventions

- CE class (in `controllers/ce/`): all endpoint logic, NOT annotated as `@RestController`
- EE class (in `controllers/`): `@RestController` + `@RequestMapping`, empty body, extends CE
- URL paths: `/api/v1/{resource}` — constants in `UrlCE.java`
- Response: always `Mono<ResponseDTO<T>>`; `@JsonView(Views.Public.class)` on every endpoint
- Zero business logic — delegate to services. No error handling — global `@ControllerAdvice`

## Repository Conventions

- ACL-aware queries via `queryBuilder()` fluent API with `Bridge` criteria
- No `@Query` annotations — use `Bridge` query builder exclusively
- Field references via `@FieldNameConstants` (`Fields` inner class)
- Soft deletes: `archive()` sets `deletedAt`; queries auto-filter

## Domain / DTO Conventions

- `@Getter`, `@Setter`, `@ToString` — **not** `@Data`
- `@FieldNameConstants` on all domains/DTOs
- `@JsonView` controls API visibility (`Views.Public.class`, `Views.Internal.class`)
- `@Transient` for computed fields; domains follow CE-EE split (`ActionDTO extends ActionCE_DTO`)

## Reactive Patterns

All service methods return `Mono<T>` or `Flux<T>`. Never `.block()` in production code.
- `.switchIfEmpty(Mono.error(...))` for not-found; `Mono.cache()` to prevent duplicate subscriptions
- `Mono.zip()` / `.zipWhen()` for parallel/dependent ops; `Mono.defer()` for lazy eval
- `.onErrorResume()` for degradation; `.onErrorMap()` to translate to `AppsmithException`

## Error Handling

- `AppsmithException(AppsmithError.SOME_ERROR, args...)` — 100+ errors with HTTP status + error code
- Global `GlobalExceptionHandler` catches and returns `ResponseDTO<ErrorDTO>`

## Feature Flags

- `@FeatureFlagged(featureFlagName = FeatureFlagEnum.XXX)` on EE methods
- AOP dispatches: flag ON → EE method; flag OFF → superclass (CE-Compatible/CE)
- Sync methods need `organizationId` param; flags evaluated per-org with user fallback
- New flags: add to `FeatureFlagEnum` in `appsmith-interfaces`

## Running a Single Test

```bash
cd app/server && source envs/test.env.example && mvn test -pl appsmith-server -Dtest=ClassName
```

Docker must be running. Unit tests use embedded MongoDB (Flapdoodle) — do NOT start local MongoDB.

## Build Commands

```bash
cd app/server && mvn spotless:apply                    # Format code
cd app/server && ./build.sh -DskipTests                # Build without tests
cd app/server && ./build.sh -DskipTests -T 8           # Build (8 threads)
```
