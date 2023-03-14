package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.external.plugins.exceptions.RedisErrorMessages;
import com.external.plugins.exceptions.RedisPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import redis.clients.jedis.JedisPool;

import java.util.*;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@Testcontainers
public class RedisPluginTest {
    @Container
    public static final GenericContainer redis = new GenericContainer(DockerImageName.parse("redis:6.2.0-alpine"))
            .withExposedPorts(6379);
    private static String host;
    private static Integer port;

    private RedisPlugin.RedisPluginExecutor pluginExecutor = new RedisPlugin.RedisPluginExecutor();

    @BeforeAll
    public static void setup() {
        host = redis.getContainerIpAddress();
        port = redis.getFirstMappedPort();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        return datasourceConfiguration;
    }

    @Test
    public void itShouldCreateDatasource() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisPoolMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();

        pluginExecutor.datasourceDestroy(jedisPoolMono.block());
    }

    @Test
    public void itShouldValidateDatasourceWithNoEndpoints() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        assertEquals(Set.of(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(Set.of(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
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
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration)
        );
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
    public void itShouldThrowErrorIfEmptyBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

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

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

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

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertEquals("PONG", node.get("result").asText());
                }).verifyComplete();
    }

    @Test
    public void itShouldExecuteCommandWithArgs() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Getting a non-existent key
        ActionConfiguration getActionConfiguration = new ActionConfiguration();
        getActionConfiguration.setBody("GET key");
        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration,
                        getActionConfiguration));
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
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            getActionConfiguration.getBody(), null, null, null));
                    assertEquals(actionExecutionResult.getRequest().getRequestParams().toString(),
                            expectedRequestParams.toString());
                }).verifyComplete();

        // Set keys
        ActionConfiguration setActionConfigurationManyKeys = new ActionConfiguration();
        setActionConfigurationManyKeys.setBody("mset key1 value key2 \"value\" key3 \"my value\" key4 'value' key5 'my " +
                "value' key6 '{\"a\":\"b\"}'");
        actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration,
                        setActionConfigurationManyKeys));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertEquals("OK", node.get("result").asText());
                }).verifyComplete();

        // Verify the keys
        ActionConfiguration getActionConfigurationManyKeys = new ActionConfiguration();
        getActionConfigurationManyKeys.setBody("mget key1 key2 key3 key4 key5 key6");
        actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration,
                        getActionConfigurationManyKeys));
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
                }).verifyComplete();
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

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertTrue(node.get("result").asText().contains("db=7"));
                }).verifyComplete();
    }

    @Test
    public void testDefaultDatabase() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        DBAuth auth = new DBAuth();
        datasourceConfiguration.setAuthentication(auth);
        Mono<JedisPool> jedisPoolMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("CLIENT INFO");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisPoolMono
                .flatMap(jedisPool -> pluginExecutor.execute(jedisPool, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    assertTrue(node.get("result").asText().contains("db=0"));
                }).verifyComplete();
    }

    @Test
    public void verifyUniquenessOfRedisPluginErrorCode() {
        assert (Arrays.stream(RedisPluginError.values()).map(RedisPluginError::getAppErrorCode).distinct().count() == RedisPluginError.values().length);

        assert (Arrays.stream(RedisPluginError.values()).map(RedisPluginError::getAppErrorCode)
                .filter(appErrorCode-> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-RDS"))
                .collect(Collectors.toList()).size() == 0);

    }
}
