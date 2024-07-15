package com.external.plugins;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.KeyPairAuth;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.UploadedFile;
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.plugins.exceptions.SnowflakePluginError;
import com.external.utils.ExecutionUtils;
import com.external.utils.SnowflakeKeyUtils;
import com.external.utils.ValidationUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.MapType;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.extern.slf4j.Slf4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.stubbing.Answer;
import org.springframework.core.io.ClassPathResource;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.PrivateKey;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.*;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.Authentication.DB_AUTH;
import static com.appsmith.external.constants.Authentication.SNOWFLAKE_KEY_PAIR_AUTH;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Slf4j
public class SnowflakePluginTest {

    SnowflakePlugin.SnowflakePluginExecutor pluginExecutor = new SnowflakePlugin.SnowflakePluginExecutor();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static String getPrivateKeyWithoutPEMFormatting() throws Exception {
        // Generate a private key
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        PrivateKey privateKey = keyPair.getPrivate();

        // Get encoded bytes of the private key
        byte[] privateKeyEncoded = privateKey.getEncoded();

        // Encode bytes to Base64
        String privateKeyBase64 = Base64.getEncoder().encodeToString(privateKeyEncoded);
        return privateKeyBase64;
    }

    private static String getValidUnEncryptedPrivateKey() throws Exception {
        String privateKeyBase64 = getPrivateKeyWithoutPEMFormatting();

        // Format as PEM format
        StringBuilder pemFormat = new StringBuilder();
        pemFormat.append("-----BEGIN PRIVATE KEY-----\n");
        pemFormat.append(privateKeyBase64);
        pemFormat.append("\n-----END PRIVATE KEY-----\n");

        String finalEncodedString =
                Base64.getEncoder().encodeToString(pemFormat.toString().getBytes(StandardCharsets.UTF_8));

        return finalEncodedString;
    }

    private static DatasourceConfiguration createBasicAuthConfig() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        // Creates authentication object
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        auth.setAuthenticationType(DB_AUTH);
        datasourceConfiguration.setAuthentication(auth);

        // Sets default properties
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("warehouse", "warehouse"));
        properties.add(new Property("db", "dbName"));
        properties.add(new Property("schema", "schemaName"));
        properties.add(new Property("role", "userRole"));
        datasourceConfiguration.setUrl("invalid.host.name");
        datasourceConfiguration.setProperties(properties);

        return datasourceConfiguration;
    }

    private static DatasourceConfiguration createKeyPairAuthConfig(String privateKeyBase64) {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        UploadedFile privateKeyFile = new UploadedFile("privateKeyFile", privateKeyBase64);

        // Creates authentication object
        KeyPairAuth auth = new KeyPairAuth();
        auth.setUsername("test");
        auth.setPrivateKey(privateKeyFile);
        auth.setPassphrase("test");
        auth.setAuthenticationType(SNOWFLAKE_KEY_PAIR_AUTH);
        datasourceConfiguration.setAuthentication(auth);

        // Sets default properties
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("warehouse", "warehouse"));
        properties.add(new Property("db", "dbName"));
        properties.add(new Property("schema", "schemaName"));
        properties.add(new Property("role", "userRole"));
        datasourceConfiguration.setUrl("invalid.host.name");
        datasourceConfiguration.setProperties(properties);

        return datasourceConfiguration;
    }

    @Test
    public void testValidateDatasource_withInvalidCredentials_returnsInvalids() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername(null);
        auth.setPassword(null);
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setProperties(List.of(new Property(), new Property()));
        Set<String> output = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_SCHEMA_NAME_ERROR_MSG));
    }

    @Test
    public void testValidateDatasource_withInvalidCredentials_forkeypair_returnsInvalids() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        KeyPairAuth auth = new KeyPairAuth();
        auth.setAuthenticationType(Authentication.SNOWFLAKE_KEY_PAIR_AUTH);
        auth.setUsername(null);
        auth.setPrivateKey(null);
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setProperties(List.of(new Property(), new Property()));
        Set<String> output = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_PRIVATE_KEY_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG));
        assertTrue(output.contains(SnowflakeErrorMessages.DS_MISSING_SCHEMA_NAME_ERROR_MSG));
    }

    @Test
    public void testDatasourceWithInvalidUrl() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        datasourceConfiguration.setAuthentication(auth);
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("warehouse", "warehouse"));
        properties.add(new Property("db", "dbName"));
        properties.add(new Property("schema", "schemaName"));
        properties.add(new Property("role", "userRole"));
        datasourceConfiguration.setUrl("invalid.host.name");
        datasourceConfiguration.setProperties(properties);
        Mono<DatasourceTestResult> output = pluginExecutor.testDatasource(datasourceConfiguration);
        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    String expectedErrorMessage =
                            "Certificate for <invalid.host.name.snowflakecomputing.com> doesn't match any of the subject alternative names";
                    Set<String> invalids = datasourceTestResult.getInvalids();
                    String errorMessage = invalids.iterator().next();
                    assertTrue(errorMessage.contains(expectedErrorMessage));
                })
                .verifyComplete();
    }

    @Test
    public void testExecute_authenticationTimeout_returnsStaleConnectionException() throws SQLException {
        final String testQuery = "testQuery";
        final Connection connection = mock(Connection.class);
        when(connection.isValid(30)).thenReturn(true);
        final Statement statement = mock(Statement.class);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(testQuery))
                .thenThrow(new SnowflakeReauthenticationRequest("1", "Authentication token expired", "", 0));

        final HikariPoolMXBean hikariPoolMXBean = mock(HikariPoolMXBean.class);
        when(hikariPoolMXBean.getActiveConnections()).thenReturn(1);
        when(hikariPoolMXBean.getIdleConnections()).thenReturn(4);
        when(hikariPoolMXBean.getTotalConnections()).thenReturn(5);
        when(hikariPoolMXBean.getThreadsAwaitingConnection()).thenReturn(0);

        final HikariDataSource hikariDataSource = mock(HikariDataSource.class);
        when(hikariDataSource.getConnection()).thenReturn(connection);
        when(hikariDataSource.isClosed()).thenReturn(false);
        when(hikariDataSource.isRunning()).thenReturn(true);
        when(hikariDataSource.getHikariPoolMXBean()).thenReturn(hikariPoolMXBean);

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(testQuery);
        final Mono<ActionExecutionResult> actionExecutionResultMono =
                pluginExecutor.execute(hikariDataSource, new DatasourceConfiguration(), actionConfiguration);

        StepVerifier.create(actionExecutionResultMono)
                .expectErrorMatches(e -> e instanceof StaleConnectionException)
                .verify();
    }

    /**
     * Although this test verifies error with bad database name, the exact same flow would also apply to bad schema
     * and warehouse name - hence not replicating the tests for schema or warehouse - as it would provide no extra
     * coverage.
     */
    @Test
    public void testValidationUtils_withBadDatabaseName() {

        // Mock datasourceCreate method to return mockConnection.
        Connection mockConnection = mock(Connection.class);

        // Mock getRowsFromQueryResult method to return row list.
        List<Map<String, Object>> rowList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("DATABASE", null);
        rowList.add(row);
        Set<String> invalids;

        try (MockedStatic<ExecutionUtils> executionUtilsMockedStatic = mockStatic(ExecutionUtils.class)) {
            executionUtilsMockedStatic
                    .when(() -> ExecutionUtils.getRowsFromQueryResult(any(), anyString()))
                    .thenAnswer((Answer<List>) invocation -> rowList);
            invalids = ValidationUtils.validateWarehouseDatabaseSchema(mockConnection);
        }

        // Check test datasource failure.
        assertNotNull(invalids);
        assertEquals(invalids.size(), 1);

        // Match error statement.
        Set<String> expectedInvalids = new HashSet<>();
        expectedInvalids.add("Appsmith could not find any valid database configured for this datasource"
                + ". Please provide a valid database by editing the Database field in the datasource "
                + "configuration page.");
        assertEquals(expectedInvalids, invalids);
    }

    @Test
    public void verifyUniquenessOfSnowflakePluginErrorCode() {
        assert (Arrays.stream(SnowflakePluginError.values())
                        .map(SnowflakePluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == SnowflakePluginError.values().length);

        assert (Arrays.stream(SnowflakePluginError.values())
                        .map(SnowflakePluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-SNW"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    @Test
    public void verifyTemplatesHasQuotesAroundMustacheSubstitutions() throws IOException {

        // reading meta file to get template file locations
        InputStream input = new ClassPathResource("templates/meta.json").getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(input));
        String meta = reader.lines().collect(Collectors.joining(System.lineSeparator()));
        Map<String, List<Map<String, String>>> result;
        ObjectMapper mapper;
        TypeFactory factory;
        MapType type;

        factory = TypeFactory.defaultInstance();
        type = factory.constructMapType(HashMap.class, String.class, List.class);
        mapper = new ObjectMapper();
        result = mapper.readValue(meta, type);

        List<String> templates = new ArrayList<>();

        // parsing each template file and putting to a string to process for mustache templates
        result.get("templates").forEach(entry -> {
            for (Map.Entry<String, String> mapEntry : entry.entrySet()) {
                try (InputStream template =
                        new ClassPathResource("templates/" + mapEntry.getValue()).getInputStream()) {
                    BufferedReader templateReader = new BufferedReader(new InputStreamReader(template));
                    String file = templateReader.lines().collect(Collectors.joining(System.lineSeparator()));
                    templates.add(file);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });

        String mustache = "\\{\\{.*?}}";
        Pattern mustachePattern = Pattern.compile(mustache);

        String enclosedMustache = "\\'\\{\\{.*?}}'";
        Pattern enclosedMustachePattern = Pattern.compile(enclosedMustache);

        // processing each template file in loop
        for (String template : templates) {

            Matcher mustacheMatcher = mustachePattern.matcher(template);
            Matcher enclosedMustacheMatcher = enclosedMustachePattern.matcher(template);

            int mustacheMatchCount = 0;
            int enclosedMustacheMatchCount = 0;

            // finding count of mustache substitution expressions
            while (mustacheMatcher.find()) {
                mustacheMatchCount++;
            }

            // finding count of mustache substitution expressions enclosed in single quotes
            while (enclosedMustacheMatcher.find()) {
                enclosedMustacheMatchCount++;
            }

            // count of mustache substitution expression and enclosed expressions should be same in hint text
            // current test is based on rationale that all fields in hint are text fields hence should be enclosed in
            // quotes in an sql query.
            // moving forward this condition can be deemed incompatible with introduction of numeric fields hence this
            // test case can then be adjusted accordingly.
            assertEquals(mustacheMatchCount, enclosedMustacheMatchCount);
        }
    }

    @Test
    public void testKeyAuthPairAuthValidPrivateKey_shouldCreateHikariConfigWithoutErrors() throws Exception {
        DatasourceConfiguration datasourceConfiguration = createKeyPairAuthConfig(getValidUnEncryptedPrivateKey());

        Mono<HikariDataSource> datasourceCreateMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(datasourceCreateMono).verifyErrorSatisfies(error -> {
            // This error is getting thrown because the account name we are sending in datasource config is not valid
            // snowflake account
            // but this ensures that hikariConfig is constructed correctly without any issues
            // and exception occurs only when we try to create hikari datasource from hikari config
            // Thus test still validates the creation of hikari config successfully
            assertTrue(error instanceof RuntimeException);
            String expectedErrorMessage =
                    "Certificate for <invalid.host.name.snowflakecomputing.com> doesn't match any of the subject alternative names";
            assertTrue(error.getMessage().contains(expectedErrorMessage));
        });
    }

    @Test
    public void testKeyAuthPairAuthInvalidPrivateKey_shouldThrowError() throws Exception {
        DatasourceConfiguration datasourceConfiguration = createKeyPairAuthConfig(getPrivateKeyWithoutPEMFormatting());

        Mono<HikariDataSource> datasourceCreateMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(datasourceCreateMono)
                .verifyErrorMessage(SnowflakeErrorMessages.UNABLE_TO_CREATE_CONNECTION_ERROR_MSG);
    }

    @Test
    public void testBasicAuth_shouldCreateHikariConfigWithoutErrors() throws Exception {
        DatasourceConfiguration datasourceConfiguration = createBasicAuthConfig();

        Mono<HikariDataSource> datasourceCreateMono = pluginExecutor.datasourceCreate(datasourceConfiguration);

        StepVerifier.create(datasourceCreateMono).verifyErrorSatisfies(error -> {
            // This error is getting thrown because the account name we are sending in datasource config is not valid
            // snowflake account
            // but this ensures that hikariConfig is constructed correctly without any issues
            // and exception occurs only when we try to create hikari datasource from hikari config
            // Thus test still validates the creation of hikari config successfully
            assertTrue(error instanceof RuntimeException);
            String expectedErrorMessage =
                    "Certificate for <invalid.host.name.snowflakecomputing.com> doesn't match any of the subject alternative names";
            assertTrue(error.getMessage().contains(expectedErrorMessage));
        });
    }

    public void testReadEncryptedPrivateKeyReturnsValidPrivateKey() throws Exception {
        DatasourceConfiguration datasourceConfiguration = createKeyPairAuthConfig(getValidUnEncryptedPrivateKey());

        KeyPairAuth auth = (KeyPairAuth) datasourceConfiguration.getAuthentication();
        PrivateKey privateKey = SnowflakeKeyUtils.readEncryptedPrivateKey(
                auth.getPrivateKey().getDecodedContent(), auth.getPassphrase());
        assertInstanceOf(PrivateKey.class, privateKey);
    }
}
