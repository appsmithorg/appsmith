package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.util.RestrictedHostFilter;
import com.external.plugins.exceptions.RedisErrorMessages;
import com.external.plugins.exceptions.RedisPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.exceptions.JedisConnectionException;
import redis.clients.jedis.exceptions.JedisException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.LockSupport;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.spy;

@Slf4j
@Testcontainers
public class RedisPluginTest {
    @Container
    public static final GenericContainer redis =
            new GenericContainer(DockerImageName.parse("redis:6.2.0-alpine")).withExposedPorts(6379);

    private static String host;
    private static Integer port;

    private RedisPlugin.RedisPluginExecutor pluginExecutor = new RedisPlugin.RedisPluginExecutor();

    @BeforeAll
    public static void setup() {
        host = redis.getContainerIpAddress();
        port = redis.getFirstMappedPort();
        // Testcontainers exposes Redis on loopback, which the production isHostBlocked filter
        // rejects (GHSA-qhfj-g87x-m39w). Allow this specific host for the duration of the test
        // class so the integration tests can drive the real Redis. Cleared in @AfterAll.
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting(host);
    }

    @AfterAll
    public static void teardown() {
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        return datasourceConfiguration;
    }

    private DatasourceConfiguration createDatasourceConfigurationWithTlsAuthType(SSLDetails.AuthType authType) {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Connection connection = new Connection();
        SSLDetails sslDetails = new SSLDetails();
        sslDetails.setAuthType(authType);
        connection.setSsl(sslDetails);
        datasourceConfiguration.setConnection(connection);
        return datasourceConfiguration;
    }

    @Test
    public void itShouldCreateDatasource() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisPoolMono).assertNext(Assertions::assertNotNull).verifyComplete();

        pluginExecutor.datasourceDestroy(jedisPoolMono.block());
    }

    @Test
    public void itShouldCreateDatasourceWithTlsEnabled() {
        DatasourceConfiguration datasourceConfiguration =
                createDatasourceConfigurationWithTlsAuthType(SSLDetails.AuthType.ENABLED);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisPoolMono).assertNext(Assertions::assertNotNull).verifyComplete();

        pluginExecutor.datasourceDestroy(jedisPoolMono.block());
    }

    @Test
    public void itShouldCreateDatasourceWithTlsDisabled() {
        DatasourceConfiguration datasourceConfiguration =
                createDatasourceConfigurationWithTlsAuthType(SSLDetails.AuthType.DISABLED);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisPoolMono).assertNext(Assertions::assertNotNull).verifyComplete();

        pluginExecutor.datasourceDestroy(jedisPoolMono.block());
    }

    @Test
    public void itShouldThrowErrorForUnsupportedTlsAuthType() {
        DatasourceConfiguration datasourceConfiguration =
                createDatasourceConfigurationWithTlsAuthType(SSLDetails.AuthType.REQUIRE);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisPoolMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithPluginException);
                    assertTrue(error.getMessage().contains("unexpected SSL option"));
                })
                .verify();
    }

    @Test
    public void datasourceCreate_blockedHost_failsWithHostNotAllowed() {
        // End-to-end check that the Redis plugin actually wires through to the SSRF filter
        // (GHSA-qhfj-g87x-m39w): a config pointing at a denylist host fails datasourceCreate
        // with HOST_NOT_ALLOWED, never opening a Jedis pool. Surefire bypasses the filter
        // JVM-wide (see root pom) so the rest of this class can talk to Testcontainers Redis
        // on loopback via the @BeforeAll allowlist; this test flips the filter back on for
        // its body so the deny path is exercised.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            DatasourceConfiguration blockedConfig = new DatasourceConfiguration();
            Endpoint endpoint = new Endpoint();
            endpoint.setHost("169.254.169.254"); // AWS instance metadata
            endpoint.setPort(6379L);
            blockedConfig.setEndpoints(Collections.singletonList(endpoint));

            StepVerifier.create(pluginExecutor.datasourceCreate(blockedConfig))
                    .expectErrorSatisfies(error -> {
                        assertTrue(error instanceof AppsmithPluginException);
                        assertTrue(
                                error.getMessage().contains(RestrictedHostFilter.HOST_NOT_ALLOWED),
                                "Expected '" + RestrictedHostFilter.HOST_NOT_ALLOWED + "', got: " + error.getMessage());
                    })
                    .verify();
        } finally {
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    public void socketFactory_blockedHost_failsAtConnectTime() {
        // The connect-time guarantee that closes the DNS-rebinding TOCTOU (GHSA-qhfj-g87x-m39w):
        // RestrictedHostJedisSocketFactory re-validates with a single DNS resolution at the moment
        // it opens the socket, so even if the datasourceCreate pre-check were bypassed by a flipping
        // resolver, the factory still refuses to connect to a denylisted address. Surefire bypasses
        // the filter JVM-wide (see root pom); flip it back on for this body.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            JedisClientConfig clientConfig = DefaultJedisClientConfig.builder().build();
            RestrictedHostJedisSocketFactory factory =
                    new RestrictedHostJedisSocketFactory(new HostAndPort("169.254.169.254", 6379), clientConfig);

            JedisConnectionException ex =
                    Assertions.assertThrows(JedisConnectionException.class, factory::createSocket);
            assertTrue(
                    ex.getMessage().contains(RestrictedHostFilter.HOST_NOT_ALLOWED),
                    "Expected '" + RestrictedHostFilter.HOST_NOT_ALLOWED + "', got: " + ex.getMessage());
        } finally {
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    public void itShouldValidateDatasourceWithNoEndpoints() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        assertEquals(
                Set.of(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(
                Set.of(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyPort() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("test-host");
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        // Since default port is picked, set of invalids should be empty.
        assertEquals(pluginExecutor.validateDatasource(invalidDatasourceConfiguration), Set.of());
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidAuth() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("test-host");

        DBAuth invalidAuth = new DBAuth();
        invalidAuth.setUsername("username"); // skip password
        invalidDatasourceConfiguration.setAuthentication(invalidAuth);
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(
                Set.of(RedisErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasource() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername("test-username");
        auth.setPassword("test-password");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("test-host");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertTrue(pluginExecutor.validateDatasource(datasourceConfiguration).isEmpty());
    }

    @Test
    public void itShouldTestDatasource() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfHostnameIsInvalid() {

        String invalidHost = "invalidHost";

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(invalidHost);
        endpoint.setPort(Long.valueOf(port));

        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    // An invalid/unreachable host must fail the test with an error reported back to
                    // the user. We deliberately don't assert the exact message: Jedis 5.x reports an
                    // unresolvable host with a different string than 3.x did, so pinning to a
                    // driver-internal message makes the test brittle across upgrades.
                    assertFalse(datasourceTestResult.isSuccess());
                    assertFalse(datasourceTestResult.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfEmptyBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfInvalidRedisCommand() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("LOL");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldExecuteCommandWithoutArgs() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("PING");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertEquals("PONG", node.get("result").asText());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldExecuteCommandWithArgs() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Getting a non-existent key
        ActionConfiguration getActionConfiguration = new ActionConfiguration();
        getActionConfiguration.setBody("GET key");
        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, getActionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertEquals("null", node.get("result").asText());

                    /* - Adding only in this test as the query editor form for Redis plugin is exactly same for each
                     *  query type. Hence, checking with only one query should suffice.
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY, getActionConfiguration.getBody(), null, null, null));
                    assertEquals(
                            actionExecutionResult
                                    .getRequest()
                                    .getRequestParams()
                                    .toString(),
                            expectedRequestParams.toString());
                })
                .verifyComplete();

        // Set keys
        ActionConfiguration setActionConfigurationManyKeys = new ActionConfiguration();
        setActionConfigurationManyKeys.setBody("mset key1 value key2 \"value\" key3 \"my value\" key4 'value' key5 'my "
                + "value' key6 '{\"a\":\"b\"}'");
        actionExecutionResultMono = jedisPoolMono.flatMap(jedisPool ->
                pluginExecutor.execute(jedisPool, datasourceConfiguration, setActionConfigurationManyKeys));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertEquals("OK", node.get("result").asText());
                })
                .verifyComplete();

        // Verify the keys
        ActionConfiguration getActionConfigurationManyKeys = new ActionConfiguration();
        getActionConfigurationManyKeys.setBody("mget key1 key2 key3 key4 key5 key6");
        actionExecutionResultMono = jedisPoolMono.flatMap(jedisPool ->
                pluginExecutor.execute(jedisPool, datasourceConfiguration, getActionConfigurationManyKeys));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody());
                    assertEquals("value", node.get(0).get("result").asText());
                    assertEquals("value", node.get(1).get("result").asText());
                    assertEquals("my value", node.get(2).get("result").asText());
                    assertEquals("value", node.get(3).get("result").asText());
                    assertEquals("my value", node.get(4).get("result").asText());
                    assertEquals("{\"a\":\"b\"}", node.get(5).get("result").asText());
                })
                .verifyComplete();
    }

    @Test
    public void testSelectedDatabase() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setDatabaseName("7"); // set database to select
        datasourceConfiguration.setAuthentication(auth);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("CLIENT INFO");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertTrue(node.get("result").asText().contains("db=7"));
                })
                .verifyComplete();
    }

    @Test
    public void testDefaultDatabase() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        DBAuth auth = new DBAuth();
        datasourceConfiguration.setAuthentication(auth);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("CLIENT INFO");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono.flatMap(
                jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertTrue(node.get("result").asText().contains("db=0"));
                })
                .verifyComplete();
    }

    @Test
    public void verifyUniquenessOfRedisPluginErrorCode() {
        assert (Arrays.stream(RedisPluginError.values())
                        .map(RedisPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == RedisPluginError.values().length);

        assert (Arrays.stream(RedisPluginError.values())
                        .map(RedisPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-RDS"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_endpointNotPresent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        // setting endpoints to empty list
        dsConfig.setEndpoints(new ArrayList());

        final Mono<String> rateLimitIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(rateLimitIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAbsent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("");
        dsConfig.getEndpoints().get(0).setPort(6379L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAndPortPresent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(590L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_590", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_6379", endpointIdentifier);
                })
                .verifyComplete();
    }

    /**
     * Borrowing from the pool is network I/O (connect, and a PING on every borrow because testOnBorrow is on) and can
     * block when the pool is exhausted. The server calls execute() from the continuation of a Redis-cached lookup,
     * i.e. on a Lettuce event-loop thread, so the borrow must never happen on the subscribing thread.
     */
    @Test
    public void execute_borrowsPoolConnectionOffTheSubscribingThread() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        JedisPool realPool =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        assertNotNull(realPool);
        JedisPool spyPool = spy(realPool);
        AtomicReference<String> borrowThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    borrowThread.set(Thread.currentThread().getName());
                    return invocation.callRealMethod();
                })
                .when(spyPool)
                .getResource();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("PING");
        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            StepVerifier.create(Mono.defer(
                                    () -> pluginExecutor.execute(spyPool, datasourceConfiguration, actionConfiguration))
                            .subscribeOn(caller))
                    .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
        assertNotNull(borrowThread.get(), "pool borrow never happened");
        assertFalse(
                borrowThread.get().startsWith("caller-event-loop"),
                "Jedis pool borrow ran on the subscribing thread: " + borrowThread.get());
        realPool.close();
    }

    @Test
    public void testDatasource_connection_doesNotRunOnTheSubscribingThread() {
        JedisPool realPool =
                pluginExecutor.datasourceCreate(createDatasourceConfiguration()).block();
        assertNotNull(realPool);
        JedisPool spyPool = spy(realPool);
        AtomicReference<String> borrowThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    borrowThread.set(Thread.currentThread().getName());
                    return invocation.callRealMethod();
                })
                .when(spyPool)
                .getResource();
        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            StepVerifier.create(pluginExecutor.testDatasource(spyPool).subscribeOn(caller))
                    .assertNext(result -> assertTrue(result.isSuccess()))
                    .verifyComplete();
            assertNotNull(borrowThread.get(), "PING never borrowed from the pool");
            assertFalse(
                    borrowThread.get().startsWith("caller-event-loop"),
                    "PING borrow ran on the subscribing thread: " + borrowThread.get());
            assertEquals(0, realPool.getNumActive(), "PING must return its Jedis to the pool");
        } finally {
            caller.dispose();
            realPool.close();
        }
    }

    /**
     * The server's action timeout cancels the execution while the pool borrow is still running on the plugin
     * scheduler. The borrowed Jedis must still be returned to the pool, or five such cancellations wedge the
     * datasource (maxTotal 5, blockWhenExhausted).
     */
    @Test
    public void execute_cancelledDuringBorrow_returnsJedisToPool() throws Exception {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        JedisPool realPool =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        assertNotNull(realPool);
        JedisPool spyPool = spy(realPool);
        CountDownLatch borrowStarted = new CountDownLatch(1);
        CountDownLatch releaseBorrow = new CountDownLatch(1);
        CountDownLatch borrowCompleted = new CountDownLatch(1);
        doAnswer(invocation -> {
                    borrowStarted.countDown();
                    // Disposing the execution interrupts the bounded-elastic worker, but a borrow blocked in socket
                    // I/O (connect, AUTH, the testOnBorrow PING) is not interruptible: it completes later and hands
                    // back a real Jedis. Model that by ignoring the interrupt until the test releases the borrow.
                    long giveUpAt = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                    while (releaseBorrow.getCount() > 0 && System.nanoTime() < giveUpAt) {
                        LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(20));
                    }
                    assertEquals(0, releaseBorrow.getCount(), "test did not release the borrow");
                    Thread.interrupted(); // a completed socket read leaves no pending interrupt for the pool to see
                    try {
                        return invocation.callRealMethod();
                    } finally {
                        borrowCompleted.countDown();
                    }
                })
                .when(spyPool)
                .getResource();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("PING");

        Disposable execution = pluginExecutor
                .execute(spyPool, datasourceConfiguration, actionConfiguration)
                .subscribe(result -> {}, error -> {});
        assertTrue(borrowStarted.await(10, TimeUnit.SECONDS), "borrow never started");
        execution.dispose(); // the action timeout fires while the borrow is in flight
        releaseBorrow.countDown(); // the borrow now completes into a cancelled pipeline
        assertTrue(borrowCompleted.await(10, TimeUnit.SECONDS), "borrow never completed");

        // Returning the Jedis happens asynchronously on the plugin scheduler; give it a moment.
        long deadline = System.currentTimeMillis() + 5_000;
        while (realPool.getNumActive() != 0 && System.currentTimeMillis() < deadline) {
            Thread.sleep(50);
        }
        assertEquals(0, realPool.getNumActive(), "Jedis borrowed into a cancelled execution was never returned");
        realPool.close();
    }

    /**
     * The Jedis is returned to the pool after the command ran; if the pool was destroyed concurrently the return
     * throws. A command that already executed (and may have had side effects like SET/INCR) must still report
     * success - the close failure is a cleanup problem, not a command failure.
     */
    @Test
    public void execute_poolReturnFailure_doesNotFailACommandThatExecuted() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        JedisPool realPool =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        assertNotNull(realPool);
        try {
            JedisPool spyPool = spy(realPool);
            doAnswer(invocation -> {
                        Jedis realJedis = (Jedis) invocation.callRealMethod();
                        Jedis spyJedis = spy(realJedis);
                        doAnswer(closeInvocation -> {
                                    realJedis.close(); // actually return it, then fail like a destroyed pool would
                                    throw new JedisException("pool destroyed concurrently");
                                })
                                .when(spyJedis)
                                .close();
                        return spyJedis;
                    })
                    .when(spyPool)
                    .getResource();

            ActionConfiguration actionConfiguration = new ActionConfiguration();
            actionConfiguration.setBody("PING");

            StepVerifier.create(pluginExecutor.execute(spyPool, datasourceConfiguration, actionConfiguration))
                    .assertNext(result -> assertTrue(
                            result.getIsExecutionSuccess(),
                            "a close/return failure must not fail a command that already executed"))
                    .verifyComplete();
        } finally {
            realPool.close();
        }
    }
}
