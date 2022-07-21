package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.Bucket;
import com.amazonaws.services.s3.model.DeleteObjectsResult;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.util.Base64;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.external.plugins.constants.AmazonS3Action;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.AmazonS3Plugin.DEFAULT_FILE_NAME;
import static com.external.plugins.AmazonS3Plugin.DEFAULT_URL_EXPIRY_IN_MINUTES;
import static com.external.plugins.AmazonS3Plugin.NO;
import static com.external.plugins.AmazonS3Plugin.YES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_PREFIX;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_WHERE;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static com.external.plugins.constants.FieldName.READ_EXPIRY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.utils.DatasourceUtils.getS3ClientBuilder;
import static com.external.utils.TemplateUtils.CREATE_FILE_TEMPLATE_NAME;
import static com.external.utils.TemplateUtils.CREATE_MULTIPLE_FILES_TEMPLATE_NAME;
import static com.external.utils.TemplateUtils.DEFAULT_DIR;
import static com.external.utils.TemplateUtils.DELETE_FILE_TEMPLATE_NAME;
import static com.external.utils.TemplateUtils.DELETE_MULTIPLE_FILES_TEMPLATE_NAME;
import static com.external.utils.TemplateUtils.FILE_PICKER_DATA_EXPRESSION;
import static com.external.utils.TemplateUtils.FILE_PICKER_MULTIPLE_FILES_DATA_EXPRESSION;
import static com.external.utils.TemplateUtils.LIST_FILES_TEMPLATE_NAME;
import static com.external.utils.TemplateUtils.LIST_OF_FILES_STRING;
import static com.external.utils.TemplateUtils.READ_FILE_TEMPLATE_NAME;
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
                    assertEquals(0, res.size());
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
        actionConfiguration.setFormData(new HashMap<>());
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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "LIST");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, LIST_SIGNED_URL, "NO");

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

                    ArrayNode node = (ArrayNode) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName").asText());
                    resultFilenamesArray.add(node.get(1).get("fileName").asText());
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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");

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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "{\"data\": {{dynamicallyFoundFilePickerObject}}}");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, true);
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");

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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "erroneousBody");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "YES");
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

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
                    expectedRequestParams.add(new RequestParamDTO(COMMAND,
                            "UPLOAD_FILE_FROM_BODY", null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, "path", null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64", null,
                            null, null)); // File data type
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testFileUploadFromBodyWithFilepickerAndNonBase64() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "{\"data\": \"dummyBody;\"}");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_FILE_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "YES");
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

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
                    expectedRequestParams.add(new RequestParamDTO(COMMAND,
                            "UPLOAD_FILE_FROM_BODY", null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, "path", null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64", null,
                            null, null)); // File data type
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }

    /*
     * - This method tests the create multiple files program flow till the point where an actual call is made by the AmazonS3
     *   connection to upload a file.
     * - If everything goes well, then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testCreateMultipleFilesFromBodyWithFalseCredentialsAndNonNullDuration() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "UPLOAD_MULTIPLE_FILES_FROM_BODY");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, "NO");
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, "100000");

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
    public void testReadFileFromPathWithoutBase64Encoding() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "READ_FILE");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, READ_DATATYPE, "NO");

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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "READ_FILE");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, READ_DATATYPE, "YES");

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
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "READ_FILE",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, "path", null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(READ_DATATYPE, "YES", null,
                            null, null)); // Base64 encode file
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteFile() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE_FILE");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");

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
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "DELETE_FILE",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, "path", null, null, null)); // Path
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithPrefix() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "LIST");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, LIST_PREFIX, "Hel");

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

                    ArrayNode node = (ArrayNode) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName").asText());
                    resultFilenamesArray.add(node.get(1).get("fileName").asText());
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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "LIST");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, LIST_SIGNED_URL, "NO");
        setDataValueSafelyInFormData(configMap, LIST_UNSIGNED_URL, "YES");
        setDataValueSafelyInFormData(configMap, LIST_PREFIX, "");

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

                    ArrayNode node = (ArrayNode) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName").asText());
                    resultFilenamesArray.add(node.get(1).get("fileName").asText());
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("url").asText());
                    resultUrlArray.add(node.get(1).get("url").asText());
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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "LIST");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, LIST_SIGNED_URL, "YES");
        setDataValueSafelyInFormData(configMap, LIST_EXPIRY, "1000");
        setDataValueSafelyInFormData(configMap, LIST_PREFIX, "");

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

                    ArrayNode node = (ArrayNode) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName").asText());
                    resultFilenamesArray.add(node.get(1).get("fileName").asText());
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("signedUrl").asText());
                    resultUrlArray.add(node.get(1).get("signedUrl").asText());
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

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, "path");
        setDataValueSafelyInFormData(configMap, COMMAND, "LIST");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");
        setDataValueSafelyInFormData(configMap, LIST_SIGNED_URL, "YES");
        setDataValueSafelyInFormData(configMap, LIST_PREFIX, "");

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

                    ArrayNode node = (ArrayNode) result.getBody();
                    ArrayList<String> resultFilenamesArray = new ArrayList<>();
                    resultFilenamesArray.add(node.get(0).get("fileName").asText());
                    resultFilenamesArray.add(node.get(1).get("fileName").asText());
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            resultFilenamesArray.toArray()
                    );

                    ArrayList<String> resultUrlArray = new ArrayList<>();
                    resultUrlArray.add(node.get(0).get("signedUrl").asText());
                    resultUrlArray.add(node.get(1).get("signedUrl").asText());
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
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "LIST", null
                            , null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(LIST_PREFIX, "", null,
                            null, null)); // Prefix
                    expectedRequestParams.add(new RequestParamDTO(LIST_SIGNED_URL, "YES", null,
                            null, null)); // Generate signed URL
                    expectedRequestParams.add(new RequestParamDTO(LIST_EXPIRY, "5", null,
                            null, null)); // Expiry duration
                    expectedRequestParams.add(new RequestParamDTO(LIST_UNSIGNED_URL, "NO", null,
                            null, null)); // Generate Un-signed URL
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testGetStructure() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        Bucket mockS3Bucket1 = mock(Bucket.class);
        when(mockS3Bucket1.getName()).thenReturn("dummy_bucket_1");

        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listBuckets()).thenReturn(List.of(mockS3Bucket1));

        StepVerifier.create(pluginExecutor.getStructure(mockConnection, datasourceConfiguration))
                .assertNext(datasourceStructure -> {
                    String expectedBucketName = "dummy_bucket_1";
                    assertEquals(expectedBucketName, datasourceStructure.getTables().get(0).getName());

                    List<Template> templates = datasourceStructure.getTables().get(0).getTemplates();

                    // Check list files template
                    Template listFilesTemplate = templates.get(0);
                    assertEquals(LIST_FILES_TEMPLATE_NAME, listFilesTemplate.getTitle());


                    Map<String, Object> listFilesConfig = (Map<String, Object>) listFilesTemplate.getConfiguration();
                    assertEquals(AmazonS3Action.LIST.name(), PluginUtils.getDataValueSafelyFromFormData(listFilesConfig, COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(listFilesConfig, BUCKET, STRING_TYPE));
                    assertEquals(NO, PluginUtils.getDataValueSafelyFromFormData(listFilesConfig, LIST_SIGNED_URL, STRING_TYPE));
                    assertEquals(YES, PluginUtils.getDataValueSafelyFromFormData(listFilesConfig, LIST_UNSIGNED_URL, STRING_TYPE));
                    assertEquals(new HashMap<String, Object>() {{
                                     put("condition", "AND");
                                 }},
                            PluginUtils.getDataValueSafelyFromFormData(listFilesConfig, LIST_WHERE, new TypeReference<HashMap<String, Object>>() {
                            }));

                    // Check read file template
                    Template readFileTemplate = templates.get(1);
                    assertEquals(READ_FILE_TEMPLATE_NAME, readFileTemplate.getTitle());

                    Map<String, Object> readFileConfig = (Map<String, Object>) readFileTemplate.getConfiguration();
                    assertEquals(DEFAULT_FILE_NAME, PluginUtils.getDataValueSafelyFromFormData(readFileConfig, PATH, STRING_TYPE));
                    assertEquals(AmazonS3Action.READ_FILE.name(), PluginUtils.getDataValueSafelyFromFormData(readFileConfig, COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(readFileConfig, BUCKET, STRING_TYPE));
                    assertEquals(YES, PluginUtils.getDataValueSafelyFromFormData(readFileConfig, READ_DATATYPE, STRING_TYPE));
                    assertEquals(DEFAULT_URL_EXPIRY_IN_MINUTES, PluginUtils.getDataValueSafelyFromFormData(readFileConfig, READ_EXPIRY, STRING_TYPE));

                    // Check create file template
                    Template createFileTemplate = templates.get(2);
                    assertEquals(CREATE_FILE_TEMPLATE_NAME, createFileTemplate.getTitle());

                    Map<String, Object> createFileConfig = (Map<String, Object>) createFileTemplate.getConfiguration();
                    assertEquals(DEFAULT_FILE_NAME, PluginUtils.getDataValueSafelyFromFormData(createFileConfig, PATH, STRING_TYPE));
                    assertEquals(FILE_PICKER_DATA_EXPRESSION, PluginUtils.getDataValueSafelyFromFormData(createFileConfig, BODY, STRING_TYPE));
                    assertEquals(AmazonS3Action.UPLOAD_FILE_FROM_BODY.name(),
                            PluginUtils.getDataValueSafelyFromFormData(createFileConfig, COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(createFileConfig, BUCKET, STRING_TYPE));
                    assertEquals(YES, PluginUtils.getDataValueSafelyFromFormData(createFileConfig, CREATE_DATATYPE, STRING_TYPE));
                    assertEquals(DEFAULT_URL_EXPIRY_IN_MINUTES, PluginUtils.getDataValueSafelyFromFormData(createFileConfig, CREATE_EXPIRY, STRING_TYPE));

                    // Check create multiple files template
                    Template createMultipleFilesTemplate = templates.get(3);
                    assertEquals(CREATE_MULTIPLE_FILES_TEMPLATE_NAME, createMultipleFilesTemplate.getTitle());

                    Map<String, Object> createMultipleFilesConfig = (Map<String, Object>) createMultipleFilesTemplate.getConfiguration();
                    assertEquals(DEFAULT_DIR, PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, PATH, STRING_TYPE));
                    assertEquals(FILE_PICKER_MULTIPLE_FILES_DATA_EXPRESSION,
                            PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, BODY, STRING_TYPE));
                    assertEquals(AmazonS3Action.UPLOAD_MULTIPLE_FILES_FROM_BODY.name(),
                            PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, BUCKET, STRING_TYPE));
                    assertEquals(YES, PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, CREATE_DATATYPE, STRING_TYPE));
                    assertEquals(DEFAULT_URL_EXPIRY_IN_MINUTES, PluginUtils.getDataValueSafelyFromFormData(createMultipleFilesConfig, CREATE_EXPIRY, STRING_TYPE));

                    // Check delete file template
                    Template deleteFileTemplate = templates.get(4);
                    assertEquals(DELETE_FILE_TEMPLATE_NAME, deleteFileTemplate.getTitle());

                    Map<String, Object> deleteFileConfig = (Map<String, Object>) deleteFileTemplate.getConfiguration();
                    assertEquals(DEFAULT_FILE_NAME, PluginUtils.getDataValueSafelyFromFormData(deleteFileConfig, PATH, STRING_TYPE));
                    assertEquals(AmazonS3Action.DELETE_FILE.name(), PluginUtils.getDataValueSafelyFromFormData(deleteFileConfig,
                            COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(deleteFileConfig, BUCKET, STRING_TYPE));

                    // Check delete multiple files template
                    Template deleteMultipleFilesTemplate = templates.get(5);
                    assertEquals(DELETE_MULTIPLE_FILES_TEMPLATE_NAME, deleteMultipleFilesTemplate.getTitle());

                    Map<String, Object> deleteMultipleFilesConfig =
                            (Map<String, Object>) deleteMultipleFilesTemplate.getConfiguration();
                    assertEquals(LIST_OF_FILES_STRING, PluginUtils.getDataValueSafelyFromFormData(deleteMultipleFilesConfig, PATH, STRING_TYPE));
                    assertEquals(AmazonS3Action.DELETE_MULTIPLE_FILES.name(),
                            PluginUtils.getDataValueSafelyFromFormData(deleteMultipleFilesConfig, COMMAND, STRING_TYPE));
                    assertEquals(expectedBucketName, PluginUtils.getDataValueSafelyFromFormData(deleteMultipleFilesConfig, BUCKET, STRING_TYPE));
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

    @Test
    public void testDeleteMultipleFiles() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        String dummyPath = "[\"image1.png\", \"image2.png\"]";

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, BODY, "[{\"data\": \"plain text\"}, {\"data\": \"plain text2\"}]");
        setDataValueSafelyInFormData(configMap, PATH, dummyPath);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE_MULTIPLE_FILES");
        setDataValueSafelyInFormData(configMap, BUCKET, "bucket_name");

        actionConfiguration.setFormData(configMap);

        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.deleteObjects(any())).thenReturn(new DeleteObjectsResult(new ArrayList<>()));

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                mockConnection,
                executeActionDTO,
                datasourceConfiguration,
                actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    Map<String, String> node = (Map<String, String>) result.getBody();
                    assertEquals("All files deleted successfully", node.get("status"));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "DELETE_MULTIPLE_FILES",
                            null, null, null)); // Action
                    expectedRequestParams.add(new RequestParamDTO(BUCKET, "bucket_name",
                            null, null, null)); // Bucket name
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, dummyPath, null, null, null)); // Path
                    assertEquals(expectedRequestParams.toString(), result.getRequest().getRequestParams().toString());
                })
                .verifyComplete();
    }
}
