package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.Bucket;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.util.Base64;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.external.plugins.AmazonS3Plugin.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_PREFIX;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.READ_USING_BASE64_ENCODING;
import static com.external.utils.DatasourceUtils.getS3ClientBuilder;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Slf4j
public class AmazonS3PluginTest {
    private static String accessKey;
    private static String secretKey;
    private static String region;
    private static String serviceProvider;

    @BeforeClass
    public static void setUp() {
        accessKey   = "access_key";
        secretKey   = "secret_key";
        region      = "ap-south-1";
        serviceProvider = "amazon-s3";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(accessKey);
        authDTO.setPassword(secretKey);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // since index 0 is not used anymore.
        properties.add(new Property("s3 service provider", serviceProvider));
        properties.add(new Property("custom endpoint region", region));
        dsConfig.setProperties(properties);
        dsConfig.setEndpoints(List.of(new Endpoint("s3-connection-url", 0L)));
        return dsConfig;
    }

    @Test
    public void testValidateDatasourceWithMissingAccessKey() {
        DBAuth authDTOWithEmptyAccessKey = new DBAuth();
        authDTOWithEmptyAccessKey.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTOWithEmptyAccessKey.setPassword(secretKey);
        /* Do not configure Access Key */

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.setAuthentication(authDTOWithEmptyAccessKey);

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    assertNotEquals(0, res.size());

                    List<String> errorList = new ArrayList<>(res);
                    assertTrue(errorList.get(0).contains("Mandatory parameter 'Access Key' is empty"));
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingSecretKey() {
        DBAuth authDTOWithEmptyAccessKey = new DBAuth();
        authDTOWithEmptyAccessKey.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTOWithEmptyAccessKey.setUsername(accessKey);
        /* Do not configure Secret Key */

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.setAuthentication(authDTOWithEmptyAccessKey);

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    Assert.assertNotEquals(0, res.size());

                    List<String> errorList = new ArrayList<>(res);
                    assertTrue(errorList.get(0).contains("Mandatory parameter 'Secret Key' is empty"));
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingRegionWithOtherS3ServiceProvider() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getProperties().get(1).setValue("other");
        datasourceConfiguration.getProperties().get(2).setValue("");

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    assertNotEquals(0, res.size());

                    List<String> errorList = new ArrayList<>(res);
                    assertTrue(errorList.get(0).contains("Required parameter 'Region' is empty. Did you forget to " +
                            "edit the 'Region' field in the datasource creation form ? You need to fill it with the " +
                            "region where your S3 instance is hosted."));
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingRegionWithListedProvider() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getProperties().get(2).setValue("");

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    assertEquals(0, res.size());
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingUrlWithNonAmazonProvider() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getProperties().get(1).setValue("upcloud");
        datasourceConfiguration.getProperties().get(2).setValue("");
        datasourceConfiguration.getEndpoints().get(0).setHost("");

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    assertNotEquals(0, res.size());

                    List<String> errorList = new ArrayList<>(res);
                    assertTrue(errorList.get(0).contains("Required parameter 'Endpoint URL' is empty. Did you forget " +
                            "to edit the 'Endpoint URL' field in the datasource creation form ? You need to fill it " +
                            "with the endpoint URL of your S3 instance."));
                })
                .verifyComplete();
    }

    @Test
    public void testTestDatasourceWithFalseCredentials() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(datasourceTestResult -> {
                    assertNotEquals(0, datasourceTestResult.getInvalids().size());

                    List<String> errorList = new ArrayList<>(datasourceTestResult.getInvalids());
                    assertTrue(errorList.get(0).contains("The AWS Access Key Id you provided does not exist in our records"));
                })
                .verifyComplete();
    }

    @Test
    public void testStaleConnectionExceptionFromExecuteMethod() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(Map.of());
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(new AmazonS3Plugin.S3PluginExecutor());
        Mono<ActionExecutionResult> resultMono = pluginExecutorMono
                                                 .flatMap(executor -> {
                                                     return executor.executeParameterized(
                                                             null,
                                                             executeActionDTO,
                                                             datasourceConfiguration,
                                                             actionConfiguration);
                                                 });

        StepVerifier.create(resultMono)
                .verifyError(StaleConnectionException.class);
    }
    
    @Test
    public void testListFilesInBucketWithNoUrl() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, LIST_SIGNED_URL, "NO");

        actionConfiguration.setFormData(configMap);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString(), anyString())).thenReturn(mockObjectListing);

        S3ObjectSummary mockS3ObjectSummary = mock(S3ObjectSummary.class);
        List<S3ObjectSummary> mockS3ObjectSummaryList = new ArrayList<>();
        mockS3ObjectSummaryList.add(mockS3ObjectSummary);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        String dummyKey1 = "file_path_1";
        String dummyKey2 = "file_path_2";
        when(mockS3ObjectSummary.getKey()).thenReturn(dummyKey1).thenReturn(dummyKey2);

        when(mockObjectListing.isTruncated()).thenReturn(true).thenReturn(false);
        when(mockConnection.listNextBatchOfObjects(mockObjectListing)).thenReturn(mockObjectListing);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    ArrayList<Map<String, String>> node = (ArrayList<Map<String, String>>) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName"));
                    resultFilenamesArray.add(node.get(1).get("fileName"));
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );
                })
                .verifyComplete();
    }

    /*
     * - This method tests the create file program flow till the point where an actual call is made by the AmazonS3
     *   connection to upload a file.
     * - If everything goes well, then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testCreateFileFromBodyWithFalseCredentialsAndNonNullDuration() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "{\"data\": \"\"}";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");
        setValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

        actionConfiguration.setFormData(configMap);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                connection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                    assertEquals(AppsmithPluginError.PLUGIN_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    /*
     * - This method tests the create file program flow till the point where an actual call is made by the AmazonS3
     *   connection to upload a file.
     * - If everything goes well, then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testFileUploadFromBodyWithMissingDuration() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "{\"data\": \"\"}";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");

        actionConfiguration.setFormData(configMap);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                connection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                    assertEquals(AppsmithPluginError.PLUGIN_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    /*
     * - This method tests the create file program flow till the point where an actual call is made by the AmazonS3
     *   connection to upload a file.
     * - If this test fails, the point of failure is expected to be the logic for smart substitution 
     * - If everything goes well, then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testSmartSubstitutionJSONBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("dynamicallyFoundFilePickerObject", "<html>Random\"Unescaped'String</html>")));
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "{\"data\": {{dynamicallyFoundFilePickerObject}}}";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, true);
        setValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");

        actionConfiguration.setFormData(configMap);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                connection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                    assertEquals(AppsmithPluginError.PLUGIN_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFileUploadFromBody_withMalformedBody_returnsErrorMessage() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "erroneousBody";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, "YES");
        setValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

        actionConfiguration.setFormData(configMap);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                connection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("Unable to parse content"));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command",
                            "UPLOAD_FILE_FROM_BODY", null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, dummyPath, null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO("create.dataType", "Base64", null,
                            null, null)); // File data type
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testFileUploadFromBodyWithFilepickerAndNonBase64() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "{\"data\": \"dummyBody;\"}";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, "YES");
        setValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

        actionConfiguration.setFormData(configMap);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                connection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("File content is not base64 encoded"));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command",
                            "UPLOAD_FILE_FROM_BODY", null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, dummyPath, null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO("create.dataType", "Base64", null,
                            null, null)); // File data type
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testReadFileFromPathWithoutBase64Encoding() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "READ_FILE");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, READ_USING_BASE64_ENCODING, "NO");

        actionConfiguration.setFormData(configMap);

        S3Object mockS3Object = mock(S3Object.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.getObject(anyString(), anyString())).thenReturn(mockS3Object);

        String dummyContent = "Hello World !!!\n";
        InputStream dummyInputStream = new ByteArrayInputStream(dummyContent.getBytes());
        S3ObjectInputStream dummyS3ObjectInputStream = new S3ObjectInputStream(dummyInputStream, null);
        when(mockS3Object.getObjectContent()).thenReturn(dummyS3ObjectInputStream);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    Map<String, Object> body = (Map<String, Object>) result.getBody();
                    assertEquals(dummyContent, body.get("fileData"));
                })
                .verifyComplete();
    }

    @Test
    public void testReadFileFromPathWithBase64Encoding() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "READ_FILE");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, READ_USING_BASE64_ENCODING, "YES");

        actionConfiguration.setFormData(configMap);

        S3Object mockS3Object = mock(S3Object.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.getObject(anyString(), anyString())).thenReturn(mockS3Object);

        String dummyContent = "Hello World !!!\n";
        InputStream dummyInputStream = new ByteArrayInputStream(dummyContent.getBytes());
        S3ObjectInputStream dummyS3ObjectInputStream = new S3ObjectInputStream(dummyInputStream, null);
        when(mockS3Object.getObjectContent()).thenReturn(dummyS3ObjectInputStream);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    Map<String, Object> body = (Map<String, Object>) result.getBody();
                    assertEquals(new String(Base64.encode(dummyContent.getBytes())), body.get("fileData"));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command", "READ_FILE",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, dummyPath, null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO("read.usingBase64Encoding", "YES", null,
                            null, null)); // Base64 encode file
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteFile() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "DELETE_FILE");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");

        actionConfiguration.setFormData(configMap);

        AmazonS3 mockConnection = mock(AmazonS3.class);
        doNothing().when(mockConnection).deleteObject(anyString(), anyString());

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    Map<String, String> node = (Map<String, String>) result.getBody();
                    assertEquals("File deleted successfully", node.get("status"));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command", "DELETE_FILE",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, dummyPath, null, null, null)); // Path
                    assertEquals(result.getRequest().getRequestParams().toString(),
                            expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithPrefix() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, LIST_PREFIX, "Hel");

        actionConfiguration.setFormData(configMap);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString(), anyString())).thenReturn(mockObjectListing);

        S3ObjectSummary mockS3ObjectSummary = mock(S3ObjectSummary.class);
        List<S3ObjectSummary> mockS3ObjectSummaryList = new ArrayList<>();
        mockS3ObjectSummaryList.add(mockS3ObjectSummary);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        String dummyKey1 = "file_path_with_matching_prefix_1";
        String dummyKey2 = "file_path_with_matching_prefix_2";
        when(mockS3ObjectSummary.getKey()).thenReturn(dummyKey1).thenReturn(dummyKey2);

        when(mockObjectListing.isTruncated()).thenReturn(true).thenReturn(false);
        when(mockConnection.listNextBatchOfObjects(mockObjectListing)).thenReturn(mockObjectListing);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    ArrayList<Map<String, String>> node = (ArrayList<Map<String, String>>) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName"));
                    resultFilenamesArray.add(node.get(1).get("fileName"));
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithUnsignedUrl() throws MalformedURLException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, LIST_SIGNED_URL, "NO");
        setValueSafelyInFormData(configMap, LIST_UNSIGNED_URL, "YES");
        setValueSafelyInFormData(configMap, LIST_PREFIX, "");

        actionConfiguration.setFormData(configMap);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString(), anyString())).thenReturn(mockObjectListing);

        S3ObjectSummary mockS3ObjectSummary = mock(S3ObjectSummary.class);
        List<S3ObjectSummary> mockS3ObjectSummaryList = new ArrayList<>();
        mockS3ObjectSummaryList.add(mockS3ObjectSummary);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        String dummyKey1 = "file_path_1";
        String dummyKey2 = "file_path_2";
        when(mockS3ObjectSummary.getKey()).thenReturn(dummyKey1).thenReturn(dummyKey2);

        when(mockObjectListing.isTruncated()).thenReturn(true).thenReturn(false);
        when(mockConnection.listNextBatchOfObjects(mockObjectListing)).thenReturn(mockObjectListing);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        URL dummyUrl1 = new URL("http", "dummy_url_1", "");
        URL dummyUrl2 = new URL("http", "dummy_url_1", "");
        when(mockConnection.getUrl(anyString(), anyString())).thenReturn(dummyUrl1).thenReturn(dummyUrl2);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    ArrayList<Map<String, String>> node = (ArrayList<Map<String, String>>) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName"));
                    resultFilenamesArray.add(node.get(1).get("fileName"));
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("url"));
                    resultUrlArray.add(node.get(1).get("url"));
                    assertArrayEquals(
                            new String[]{
                                    dummyUrl1.toString(),
                                    dummyUrl2.toString()
                            },
                            resultUrlArray.toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithSignedUrl() throws MalformedURLException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, LIST_SIGNED_URL, "YES");
        setValueSafelyInFormData(configMap, LIST_EXPIRY, "1000");
        setValueSafelyInFormData(configMap, LIST_PREFIX, "");

        actionConfiguration.setFormData(configMap);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString(), anyString())).thenReturn(mockObjectListing);

        S3ObjectSummary mockS3ObjectSummary = mock(S3ObjectSummary.class);
        List<S3ObjectSummary> mockS3ObjectSummaryList = new ArrayList<>();
        mockS3ObjectSummaryList.add(mockS3ObjectSummary);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        String dummyKey1 = "file_path_1";
        String dummyKey2 = "file_path_2";
        when(mockS3ObjectSummary.getKey()).thenReturn(dummyKey1).thenReturn(dummyKey2);

        when(mockObjectListing.isTruncated()).thenReturn(true).thenReturn(false);
        when(mockConnection.listNextBatchOfObjects(mockObjectListing)).thenReturn(mockObjectListing);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        URL dummyUrl1 = new URL("http", "dummy_url_1", "");
        URL dummyUrl2 = new URL("http", "dummy_url_1", "");
        when(mockConnection.generatePresignedUrl(any())).thenReturn(dummyUrl1).thenReturn(dummyUrl2);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    ArrayList<Map<String, String>> node = (ArrayList<Map<String, String>>) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName"));
                    resultFilenamesArray.add(node.get(1).get("fileName"));
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("signedUrl"));
                    resultUrlArray.add(node.get(1).get("signedUrl"));
                    assertArrayEquals(
                            new String[]{
                                    dummyUrl1.toString(),
                                    dummyUrl2.toString()
                            },
                            resultUrlArray.toArray()
                    );

                    assertNotNull(node.get(0).get("urlExpiryDate"));
                    assertNotNull(node.get(1).get("urlExpiryDate"));
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithSignedUrlAndNullDuration() throws MalformedURLException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST");
        setValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setValueSafelyInFormData(configMap, LIST_SIGNED_URL, "YES");
        setValueSafelyInFormData(configMap, LIST_PREFIX, "");

        actionConfiguration.setFormData(configMap);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString(), anyString())).thenReturn(mockObjectListing);

        S3ObjectSummary mockS3ObjectSummary = mock(S3ObjectSummary.class);
        List<S3ObjectSummary> mockS3ObjectSummaryList = new ArrayList<>();
        mockS3ObjectSummaryList.add(mockS3ObjectSummary);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        String dummyKey1 = "file_path_1";
        String dummyKey2 = "file_path_2";
        when(mockS3ObjectSummary.getKey()).thenReturn(dummyKey1).thenReturn(dummyKey2);

        when(mockObjectListing.isTruncated()).thenReturn(true).thenReturn(false);
        when(mockConnection.listNextBatchOfObjects(mockObjectListing)).thenReturn(mockObjectListing);
        when(mockObjectListing.getObjectSummaries()).thenReturn(mockS3ObjectSummaryList);

        URL dummyUrl1 = new URL("http", "dummy_url_1", "");
        URL dummyUrl2 = new URL("http", "dummy_url_1", "");
        when(mockConnection.generatePresignedUrl(any())).thenReturn(dummyUrl1).thenReturn(dummyUrl2);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    ArrayList<Map<String, String>> node = (ArrayList<Map<String, String>>) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName"));
                    resultFilenamesArray.add(node.get(1).get("fileName"));
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("signedUrl"));
                    resultUrlArray.add(node.get(1).get("signedUrl"));
                    assertArrayEquals(
                            new String[]{
                                    dummyUrl1.toString(),
                                    dummyUrl2.toString()
                            },
                            resultUrlArray.toArray()
                    );

                    assertNotNull(node.get(0).get("urlExpiryDate"));
                    assertNotNull(node.get(1).get("urlExpiryDate"));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command", "LIST", null
                            , null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO("list.prefix", "", null,
                            null, null)); // Prefix
                    expectedRequestParams.add(new RequestParamDTO("list.signedUrl", "YES", null,
                            null, null)); // Generate signed URL
                    expectedRequestParams.add(new RequestParamDTO("list.expiry", "5", null,
                            null, null)); // Expiry duration
                    expectedRequestParams.add(new RequestParamDTO("list.unSignedUrl", "NO", null,
                            null, null)); // Generate Un-signed URL
                    assertEquals(result.getRequest().getRequestParams().toString(),
                            expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testListBuckets() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Bucket mockS3Bucket = mock(Bucket.class);
        mockS3Bucket.setName("dummy_bucket");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, "LIST_BUCKETS");

        actionConfiguration.setFormData(configMap);

        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listBuckets()).thenReturn(List.of(mockS3Bucket));

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    Map<String, List<String>> node = (Map<String, List<String>>) result.getBody();
                    List<String> buckets = node.get("bucketList");
                    assertTrue(buckets.size() == 1);
                    assertEquals(buckets.get(0), mockS3Bucket.getName());
                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("command", "LIST_BUCKETS",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO("bucket", null,
                            null, null, null)); // Bucket name
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
            .verifyComplete();
    }

    @Test
    public void testExtractRegionFromEndpoint() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        // Test for Upcloud
        datasourceConfiguration.getProperties().get(1).setValue("upcloud");
        datasourceConfiguration.getEndpoints().get(0).setHost("appsmith-test-storage-2.de-fra1.upcloudobjects.com");

        AmazonS3ClientBuilder s3ClientBuilder = getS3ClientBuilder(datasourceConfiguration);
        assertEquals("de-fra1", s3ClientBuilder.getEndpoint().getSigningRegion());

        // Test for Wasabi
        datasourceConfiguration.getProperties().get(1).setValue("wasabi");
        datasourceConfiguration.getEndpoints().get(0).setHost("s3.ap-northeast-1.wasabisys.com");

        s3ClientBuilder = getS3ClientBuilder(datasourceConfiguration);
        assertEquals("ap-northeast-1", s3ClientBuilder.getEndpoint().getSigningRegion());

        // Test for Digital Ocean Spaces
        datasourceConfiguration.getProperties().get(1).setValue("digital-ocean-spaces");
        datasourceConfiguration.getEndpoints().get(0).setHost("fra1.digitaloceanspaces.com");

        s3ClientBuilder = getS3ClientBuilder(datasourceConfiguration);
        assertEquals("fra1", s3ClientBuilder.getEndpoint().getSigningRegion());

        // Test for Dream Objects
        datasourceConfiguration.getProperties().get(1).setValue("dream-objects");
        datasourceConfiguration.getEndpoints().get(0).setHost("objects-us-east-1.dream.io");

        s3ClientBuilder = getS3ClientBuilder(datasourceConfiguration);
        assertEquals("us-east-1", s3ClientBuilder.getEndpoint().getSigningRegion());
    }

    @Test
    public void testExtractRegionFromEndpointWithBadEndpointFormat() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        // Testing for Upcloud here. Flow for other listed service providers is same, hence not testing separately.
        datasourceConfiguration.getProperties().get(1).setValue("upcloud");
        datasourceConfiguration.getEndpoints().get(0).setHost("appsmith-test-storage-2..de-fra1.upcloudobjects.com");

        StepVerifier.create(Mono.fromCallable(() -> getS3ClientBuilder(datasourceConfiguration)))
                .expectErrorSatisfies(error -> {
                    String expectedErrorMessage = "Your S3 endpoint URL seems to be incorrect for the selected S3 " +
                            "service provider. Please check your endpoint URL and the selected S3 service provider.";
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }
}
