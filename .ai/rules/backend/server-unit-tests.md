# Server Unit Test Conventions

## Framework & Constraints

- JUnit 5 exclusively — **JUnit 4 is banned** by maven-enforcer-plugin
- Assertions: AssertJ (`assertThat`) preferred; JUnit 5 (`assertEquals`) also used
- Reactive assertions: `StepVerifier` universally (`.create()`, `.assertNext()`, `.verifyComplete()`)
- Mocking: Mockito (`@MockBean`, `@SpyBean`)
- Controller tests: `@AutoConfigureWebTestClient` + `WebTestClient`

## Running Tests

Run a single test class:
```bash
cd app/server && source envs/test.env.example && mvn test -pl appsmith-server -Dtest=ClassName
```

- Docker must be running (Testcontainers manages Redis)
- Unit tests use Flapdoodle Embedded MongoDB — do NOT start a local MongoDB instance
- Integration tests live in `src/test/it` (not `src/test/java`)

## Test Infrastructure (Managed Automatically)

- **MongoDB**: Flapdoodle Embedded MongoDB 5.0.5 with replica set (for transactions)
- **Redis**: Testcontainers `redis:6.2.6-alpine` auto-started
- **Test data**: `SeedMongoData.java` seeds users (`api_user`, `usertest@usertest.com`), plugins, organizations
- **Auth**: Most tests use `@WithUserDetails("api_user")` for authentication

## Test Patterns

### Integration test (most common)

```java
@SpringBootTest
@DirtiesContext
class SomeServiceTest {
    @Autowired
    private SomeService someService;

    @Test
    @WithUserDetails("api_user")
    void methodName_scenario_expectedBehavior() {
        Mono<Result> resultMono = someService.doSomething(input);

        StepVerifier.create(resultMono)
            .assertNext(result -> {
                assertThat(result.getField()).isEqualTo(expected);
            })
            .verifyComplete();
    }
}
```

### Unit test with mocks

```java
@ExtendWith(MockitoExtension.class)
class SomeServiceUnitTest {
    @Mock
    private DependencyService dependencyService;

    @InjectMocks
    private SomeServiceCEImpl serviceUnderTest;

    @Test
    void methodName_scenario_expectedBehavior() {
        when(dependencyService.findById(any()))
            .thenReturn(Mono.just(mockEntity));

        StepVerifier.create(serviceUnderTest.doSomething("id"))
            .assertNext(result -> assertThat(result).isNotNull())
            .verifyComplete();
    }
}
```

### Controller test

```java
@SpringBootTest
@AutoConfigureWebTestClient
class SomeControllerTest {
    @Autowired
    private WebTestClient webTestClient;

    @Test
    @WithUserDetails("api_user")
    void getEndpoint_validId_returnsSuccess() {
        webTestClient.get()
            .uri("/api/v1/resource/{id}", testId)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.data.id").isEqualTo(testId);
    }
}
```

### Feature flag test

```java
@Test
void method_featureFlagOn_executesEeLogic() {
    Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.SOME_FLAG)))
        .thenReturn(Mono.just(true));

    StepVerifier.create(service.someMethod())
        .expectNext(eeExpectedValue)
        .verifyComplete();
}

@Test
void method_featureFlagOff_fallsToCeCompatible() {
    // Default: flag returns false, aspect invokes superclass
    StepVerifier.create(service.someMethod())
        .expectNext(ceCompatibleExpectedValue)
        .verifyComplete();
}
```

## Key Conventions

- Setup/teardown: `@BeforeEach` / `@AfterEach` with `.block()` for synchronous setup
- Test naming: describe behavior — `methodName_scenario_expectedBehavior`
- CE-EE testing: test both flag-on (EE path) and flag-off (CE/CE-Compatible fallback)
- No `Thread.sleep()` — use `StepVerifier` with `Duration` or `await()` utilities
