package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.TlsConfiguration;
import com.appsmith.external.models.UploadedFile;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Set;
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
    public static final GenericContainer redis =
            new GenericContainer(DockerImageName.parse("redis:6.2.0-alpine")).withExposedPorts(6379);

    private static String host;
    private static Integer port;
    private static final String MOCK_CA_CERTIFICATE =
            "-----BEGIN CERTIFICATE-----\n" + "MIIC...mock-ca-cert...\n" + "-----END CERTIFICATE-----";

    private static final String MOCK_CLIENT_CERTIFICATE =
            "-----BEGIN CERTIFICATE-----\n" + "MIIC...mock-client-cert...\n" + "-----END CERTIFICATE-----";

    private static final String MOCK_PRIVATE_KEY =
            "-----BEGIN PRIVATE KEY-----\n" + "MIIEv...mock-private-key...\n" + "-----END PRIVATE KEY-----";

    private RedisPlugin.RedisPluginExecutor pluginExecutor = new RedisPlugin.RedisPluginExecutor();

    @BeforeAll
    public static void setup() {
        host = redis.getContainerIpAddress();
        port = redis.getFirstMappedPort();
    }

    public static UploadedFile createUploadedFile(String fileName, String content, String mimeType) {
        if (fileName == null || content == null || mimeType == null) {
            throw new IllegalArgumentException("File name, content, and MIME type cannot be null");
        }

        String base64Content =
                "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(content.getBytes());

        return new UploadedFile(fileName, base64Content);
    }

    private TlsConfiguration addTLSConfiguration() {
        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(false);
        return tlsConfiguration;
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        datasourceConfiguration.setTlsConfiguration(addTLSConfiguration());
        return datasourceConfiguration;
    }

    private DatasourceConfiguration createDatasourceConfigurationWithTLSEnabled() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        String base64CaCert = Base64.getEncoder().encodeToString(MOCK_CA_CERTIFICATE.getBytes());
        String base64ClientCert = Base64.getEncoder().encodeToString(MOCK_CLIENT_CERTIFICATE.getBytes());
        String base64PrivateKey = Base64.getEncoder().encodeToString(MOCK_PRIVATE_KEY.getBytes());

        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(true);
        tlsConfiguration.setVerifyTlsCertificate(true);
        tlsConfiguration.setCaCertificateFile(
                createUploadedFile("ca-cert.crt", base64CaCert, "application/x-x509-ca-cert"));
        tlsConfiguration.setRequiresClientAuth(true);
        tlsConfiguration.setClientCertificateFile(
                createUploadedFile("client-cert.crt", base64ClientCert, "application/x-x509-ca-cert"));
        tlsConfiguration.setClientKeyFile(
                createUploadedFile("client-key.key", base64PrivateKey, "application/x-pem-file"));
        datasourceConfiguration.setTlsConfiguration(tlsConfiguration);
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
    public void itShouldValidateDatasourceWithNoEndpoints() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();
        invalidDatasourceConfiguration.setTlsConfiguration(addTLSConfiguration());

        assertEquals(
                Set.of(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        invalidDatasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        invalidDatasourceConfiguration.setTlsConfiguration(addTLSConfiguration());

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
        invalidDatasourceConfiguration.setTlsConfiguration(addTLSConfiguration());

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
        invalidDatasourceConfiguration.setTlsConfiguration(addTLSConfiguration());

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
        datasourceConfiguration.setTlsConfiguration(addTLSConfiguration());

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
    public void itShouldValidateDatasourceWithTlsEnabledAndMissingCACertificate() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(true);
        tlsConfiguration.setVerifyTlsCertificate(true);
        tlsConfiguration.setRequiresClientAuth(false);
        datasourceConfiguration.setTlsConfiguration(tlsConfiguration);

        assertEquals(
                Set.of(RedisErrorMessages.CA_CERTIFICATE_MISSING_ERROR_MSG),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithTlsEnabledAndMissingClientCertificate() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(true);
        tlsConfiguration.setVerifyTlsCertificate(false);
        tlsConfiguration.setRequiresClientAuth(true);
        tlsConfiguration.setClientKeyFile(new UploadedFile("client-key", "base64Key"));
        datasourceConfiguration.setTlsConfiguration(tlsConfiguration);
        assertEquals(
                Set.of(RedisErrorMessages.TLS_CLIENT_AUTH_ENABLED_BUT_CLIENT_CERTIFICATE_MISSING_ERROR_MSG),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithTlsEnabledAndMissingKey() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(true);
        tlsConfiguration.setVerifyTlsCertificate(false);
        tlsConfiguration.setRequiresClientAuth(true);
        tlsConfiguration.setClientCertificateFile(new UploadedFile("client-cert", "base64Key"));
        datasourceConfiguration.setTlsConfiguration(tlsConfiguration);
        assertEquals(
                Set.of(RedisErrorMessages.TLS_CLIENT_AUTH_ENABLED_BUT_CLIENT_KEY_MISSING_ERROR_MSG),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldPassValidationWithTlsEnabledAndValidCertificates() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TlsConfiguration tlsConfiguration = new TlsConfiguration();
        tlsConfiguration.setTlsEnabled(true);
        tlsConfiguration.setVerifyTlsCertificate(true);
        tlsConfiguration.setRequiresClientAuth(true);
        tlsConfiguration.setCaCertificateFile(new UploadedFile("ca-cert", "base64Key"));
        tlsConfiguration.setClientCertificateFile(new UploadedFile("client-cert", "base64Key"));
        tlsConfiguration.setClientKeyFile(new UploadedFile("client-key", "base64Key"));
        datasourceConfiguration.setTlsConfiguration(tlsConfiguration);

        assertTrue(pluginExecutor.validateDatasource(datasourceConfiguration).isEmpty());
    }

    @Test
    public void itShouldTestDatasourceWithTlsEnabledAndValidCertificates() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfigurationWithTLSEnabled();
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                })
                .verifyComplete();
    }

    @Test
    public void itShouldThrowErrorIfHostnameIsInvalid() {

        String invalidHost = "invalidHost";
        String errorMessage = "Failed connecting to " + invalidHost + ":" + port;

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(invalidHost);
        endpoint.setPort(Long.valueOf(port));

        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().contains(errorMessage));
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
}
