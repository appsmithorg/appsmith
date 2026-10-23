package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.util.RestrictedHostFilter;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.test.StepVerifier;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DisplayName("GHSA-v84q-p5fq-82mp: Redis bindings are passed as single command arguments")
class RedisPluginBindingTest {

    private static final String STATIC_COMMAND_MESSAGE =
            "Redis command names must be static. Use bindings only in command arguments.";

    @Container
    static final GenericContainer<?> redis =
            new GenericContainer<>(DockerImageName.parse("redis:6.2.0-alpine")).withExposedPorts(6379);

    private static String host;
    private static Integer port;

    private final RedisPlugin.RedisPluginExecutor pluginExecutor = new RedisPlugin.RedisPluginExecutor();
    private final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
    private JedisPool jedisPool;

    @BeforeAll
    static void setUpClass() {
        host = redis.getHost();
        port = redis.getFirstMappedPort();
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting(host);
    }

    @AfterAll
    static void tearDownClass() {
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
    }

    @BeforeEach
    void setUp() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        jedisPool = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        try (Jedis jedis = new Jedis(host, port)) {
            jedis.flushDB();
        }
    }

    @AfterEach
    void tearDown() {
        pluginExecutor.datasourceDestroy(jedisPool);
    }

    private static ExecuteActionDTO params(String... keysAndValues) {
        List<Param> params = new ArrayList<>();
        for (int i = 0; i < keysAndValues.length; i += 2) {
            Param param = new Param();
            param.setKey(keysAndValues[i]);
            param.setValue(keysAndValues[i + 1]);
            params.add(param);
        }
        ExecuteActionDTO dto = new ExecuteActionDTO();
        dto.setParams(params);
        return dto;
    }

    private static ActionConfiguration action(String body) {
        ActionConfiguration action = new ActionConfiguration();
        action.setBody(body);
        return action;
    }

    private static String storedValue(String key) {
        try (Jedis jedis = new Jedis(host, port)) {
            return jedis.get(key);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"two words", "say \"hello\"", "it's here", "  padded  "})
    void should_storeBoundValueAsOneArgument_when_valueContainsSpacesOrQuotes(String value) {
        // Given
        assertThat(storedValue("greeting")).isNull();
        ActionConfiguration action = action("SET {{Input1.text}} {{Input2.text}}");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(
                        jedisPool,
                        params("Input1.text", "greeting", "Input2.text", value),
                        datasourceConfiguration,
                        action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(storedValue("greeting")).isEqualTo(value);
    }

    @Test
    void should_storeEmptyValue_when_boundValueIsEmpty() {
        // Given
        assertThat(storedValue("note")).isNull();
        ActionConfiguration action = action("SET {{Input1.text}} {{Input2.text}}");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(
                        jedisPool, params("Input1.text", "note", "Input2.text", ""), datasourceConfiguration, action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(storedValue("note")).isEmpty();
    }

    @Test
    void should_keepTokenAsOneArgument_when_bindingIsJoinedWithLiteralText() {
        // Given
        assertThat(storedValue("user:jane doe:name")).isNull();
        ActionConfiguration action = action("SET user:{{Input1.text}}:name {{Input2.text}}");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(
                        jedisPool,
                        params("Input1.text", "jane doe", "Input2.text", "Jane"),
                        datasourceConfiguration,
                        action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(storedValue("user:jane doe:name")).isEqualTo("Jane");
    }

    @Test
    void should_rejectQuery_when_commandNameIsBound() {
        // Given
        ActionConfiguration action = action("{{Input1.text}} greeting");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(jedisPool, params("Input1.text", "GET"), datasourceConfiguration, action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails()).isNotNull();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getAppErrorCode());
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage()).isEqualTo(STATIC_COMMAND_MESSAGE);
    }

    @Test
    void should_rejectQuery_when_boundValueIsMissing() {
        // Given
        ActionConfiguration action = action("SET {{Input1.text}} {{Input2.text}}");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(jedisPool, params("Input1.text", "greeting"), datasourceConfiguration, action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails()).isNotNull();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode())
                .isEqualTo(AppsmithPluginError.SMART_SUBSTITUTION_VALUE_MISSING.getAppErrorCode());
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo(AppsmithPluginError.SMART_SUBSTITUTION_VALUE_MISSING.getMessage("Input2.text"));
        assertThat(storedValue("greeting")).isNull();
    }

    @Test
    void should_runQuery_when_staticCommandUsesSimpleBinding() {
        // Given
        try (Jedis jedis = new Jedis(host, port)) {
            jedis.set("city", "Austin");
        }
        ActionConfiguration action = action("GET {{Input1.text}}");

        // When / Then
        StepVerifier.create(pluginExecutor.executeParameterized(
                        jedisPool, params("Input1.text", "city"), datasourceConfiguration, action))
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isTrue();
                    assertThat(result.getBody().toString()).contains("Austin");
                })
                .verifyComplete();
    }

    @Test
    void should_rejectQuery_when_bindingIsPartOfCommandName() {
        // Given
        ActionConfiguration action = action("GE{{Input1.text}} greeting");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterized(jedisPool, params("Input1.text", "T"), datasourceConfiguration, action)
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails()).isNotNull();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getAppErrorCode());
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage()).isEqualTo(STATIC_COMMAND_MESSAGE);
    }

    @Test
    void should_storeBoundValueAsOneArgument_when_queryRunsThroughServerEntrypoint() {
        // Given
        assertThat(storedValue("greeting")).isNull();
        ActionConfiguration action = action("SET {{Input1.text}} {{Input2.text}}");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterizedWithMetricsAndFlags(
                        jedisPool,
                        params("Input1.text", "greeting", "Input2.text", "two words"),
                        datasourceConfiguration,
                        action,
                        ObservationRegistry.NOOP,
                        Map.of())
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(storedValue("greeting")).isEqualTo("two words");
    }

    @Test
    void should_runQuery_when_queryWithoutBindingsRunsThroughServerEntrypoint() {
        // Given
        assertThat(storedValue("greeting")).isNull();
        ActionConfiguration action = action("SET greeting \"hello there\"");

        // When
        ActionExecutionResult result = pluginExecutor
                .executeParameterizedWithMetricsAndFlags(
                        jedisPool, params(), datasourceConfiguration, action, ObservationRegistry.NOOP, Map.of())
                .block();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(storedValue("greeting")).isEqualTo("\"hello there\"");
    }
}
