# Java tests

Conventions for JUnit tests under `app/server`. They apply to the test classes and
test methods a change adds. They do not apply to tests that already exist: a change
whose purpose is something else leaves the names and structure of neighbouring tests
as they are, even when a new method sits beside old-style ones in the same class.
Most of the existing suite predates these conventions and is not being migrated.

## Stack

- JUnit 5 (`org.junit.jupiter.api`). No JUnit 4 imports (`org.junit.Test`, `@Before`, `@RunWith`).
- AssertJ (`assertThat`, `assertThatThrownBy`) for assertions, not `assertEquals` / `assertTrue` / Hamcrest.
- Mockito with `@ExtendWith(MockitoExtension.class)`: `@Mock` for dependencies, `@InjectMocks` for the class under test.
- `StepVerifier` for anything that returns `Mono` or `Flux`.
- `@SpringBootTest` only when the test needs the Spring context (HTTP filters, security, repositories).

## Shape of a new test

- Name: `should_<expectedBehavior>_when_<condition>`, for example `should_return401_when_unauthenticated`. Add `@DisplayName` only when the name alone cannot carry the scenario, such as a GHSA identifier or a long precondition.
- Body: `// Given`, `// When`, `// Then` comment separators, in that order.
- Visibility: package-private class and methods, no `public`.
- One behaviour per test. The same logic across several inputs is one `@ParameterizedTest`, not several methods.
- Assert the specific exception type and message. Never `assertThrows(RuntimeException.class, ...)`.
- No `Thread.sleep`. Use `StepVerifier.withVirtualTime` or Awaitility.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void should_returnUser_when_idExists() {
        // Given
        User expected = new User("abc123", "Jane");
        when(userRepository.findById("abc123")).thenReturn(Mono.just(expected));

        // When
        Mono<User> result = userService.findById("abc123");

        // Then
        StepVerifier.create(result)
                .assertNext(user -> assertThat(user.getName()).isEqualTo("Jane"))
                .verifyComplete();
    }
}
```

## Reviewing

A review comment on a Java test is about the test methods the change adds.
Pre-existing methods in the same file are out of scope, even when the diff touches
them for an unrelated reason such as an import, a moved fixture, or a changed
assertion. Renames, separators, and restructuring of existing tests are not
requested.
