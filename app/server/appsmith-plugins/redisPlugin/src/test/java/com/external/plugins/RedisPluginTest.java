package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import redis.clients.jedis.Jedis;

import java.util.Collections;
import java.util.Set;

@Slf4j
public class RedisPluginTest {
    @ClassRule
    public static final GenericContainer redis = new GenericContainer(DockerImageName.parse("redis:5.0.3-alpine"))
            .withExposedPorts(6379);
    private static String host;
    private static Integer port;

    private RedisPlugin.RedisPluginExecutor pluginExecutor = new RedisPlugin.RedisPluginExecutor();

    @BeforeClass
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
        Mono<Jedis> jedisMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(jedisMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();

        pluginExecutor.datasourceDestroy(jedisMono.block());
    }

    @Test
    public void itShouldValidateDatasourceWithNoEndpoints() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Assert.assertEquals(Set.of("Missing endpoint(s)"),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(Set.of("Missing port for endpoint", "Missing host for endpoint"),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyPort() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("test-host");
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(pluginExecutor.validateDatasource(invalidDatasourceConfiguration), Set.of("Missing port for endpoint"));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidAuth() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("test-host");

        DBAuth invalidAuth = new DBAuth();
        invalidAuth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);

        invalidDatasourceConfiguration.setAuthentication(invalidAuth);
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(
                Set.of("Missing port for endpoint", "Missing username for authentication.", "Missing password for authentication."),
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

        Assert.assertTrue(pluginExecutor.validateDatasource(datasourceConfiguration).isEmpty());
    }

    @Test
    public void itShouldTestDatasource() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    Assert.assertNotNull(datasourceTestResult);
                    Assert.assertTrue(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfEmptyBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<Jedis> jedisMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    Assert.assertNotNull(result);
                    Assert.assertFalse(result.getIsExecutionSuccess());
                    Assert.assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfInvalidRedisCommand() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<Jedis> jedisMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("LOL");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    Assert.assertNotNull(result);
                    Assert.assertFalse(result.getIsExecutionSuccess());
                    Assert.assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldExecuteCommandWithoutArgs() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<Jedis> jedisMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("PING");

        Mono<ActionExecutionResult> actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    Assert.assertNotNull(actionExecutionResult);
                    Assert.assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    Assert.assertEquals("PONG", node.get("result").asText());
                }).verifyComplete();
    }

    @Test
    public void itShouldExecuteCommandWithArgs() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Mono<Jedis> jedisMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Getting a non-existent key
        ActionConfiguration getActionConfiguration = new ActionConfiguration();
        getActionConfiguration.setBody("GET key");
        Mono<ActionExecutionResult> actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, getActionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    Assert.assertNotNull(actionExecutionResult);
                    Assert.assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    Assert.assertEquals("null", node.get("result").asText());
                }).verifyComplete();

        // Setting a key
        ActionConfiguration setActionConfiguration = new ActionConfiguration();
        setActionConfiguration.setBody("SET key value");
        actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, setActionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    Assert.assertNotNull(actionExecutionResult);
                    Assert.assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    Assert.assertEquals("OK", node.get("result").asText());
                }).verifyComplete();

        // Getting the key
        actionExecutionResultMono = jedisMono
                .flatMap(jedis -> pluginExecutor.execute(jedis, datasourceConfiguration, getActionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    Assert.assertNotNull(actionExecutionResult);
                    Assert.assertNotNull(actionExecutionResult.getBody());
                    final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
                    Assert.assertEquals("value", node.get("result").asText());
                }).verifyComplete();
    }
}
