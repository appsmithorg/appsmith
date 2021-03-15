package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.util.Base64;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
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
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        properties.add(new Property("amazon s3 region", region));
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
    public void testValidateDatasourceWithMissingRegionWithAmazonS3() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getProperties().get(0).setValue("");

        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    assertNotEquals(0, res.size());

                    List<String> errorList = new ArrayList<>(res);
                    assertTrue(errorList.get(0).contains("Required parameter 'Region' is empty. Did you forget to " +
                            "edit the 'Region' field in the datasource creation form ? You need to fill it with the " +
                            "region where your AWS S3 instance is hosted."));
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingRegionWithNonAmazonProvider() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getProperties().get(1).setValue("upcloud");
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
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Mono<AmazonS3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(new AmazonS3Plugin.S3PluginExecutor());
        Mono<ActionExecutionResult> resultMono = pluginExecutorMono
                                                 .flatMap(executor -> {
                                                     return executor.execute(
                                                             null,
                                                             datasourceConfiguration,
                                                             actionConfiguration);
                                                 });

        StepVerifier.create(resultMono)
                .verifyError(StaleConnectionException.class);
    }
    
    @Test
    public void testListFilesInBucketWithNoUrl() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "LIST"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property("getSignedUrl", "NO"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                                                                    mockConnection,
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
     * - If everything goes well, then then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testCreateFileFromBodyWithFalseCredentialsAndNonNullDuration() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "UPLOAD_FILE_FROM_BODY"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property("usingFilepicker", "NO"));
        properties.add(new Property("duration", "100000"));

        actionConfiguration.setPluginSpecifiedTemplates(properties);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                                                                    connection,
                                                                    datasourceConfiguration,
                                                                    actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                })
                .verifyComplete();
    }

    /*
     * - This method tests the create file program flow till the point where an actual call is made by the AmazonS3
     *   connection to upload a file.
     * - If everything goes well, then then only expected exception is the one thrown by AmazonS3 connection
     *   regarding false credentials.
     */
    @Test
    public void testFileUploadFromBodyWithMissingDuration() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "UPLOAD_FILE_FROM_BODY"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property("usingFilepicker", "NO"));
        properties.add(new Property("duration", null));

        actionConfiguration.setPluginSpecifiedTemplates(properties);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                connection,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                })
                .verifyComplete();
    }


    @Test
    public void testFileUploadFromBodyWithFilepickerAndNonBase64() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "dummyBody;";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "UPLOAD_FILE_FROM_BODY"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property(null, null));
        properties.add(new Property("usingBase64Encoding", "YES"));
        properties.add(new Property("duration", "1000000"));

        actionConfiguration.setPluginSpecifiedTemplates(properties);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                                                                    connection,
                                                                    datasourceConfiguration,
                                                                    actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    String message = (String) result.getBody();
                    assertTrue(message.contains("File content is not base64 encoded"));
                })
                .verifyComplete();
    }

    @Test
    public void testReadFileFromPathWithoutBase64Encoding() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "READ_FILE"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, null)); /* not relevant to this test */
        properties.add(new Property(null, null)); /* not relevant to this test */
        properties.add(new Property("encodeBase64", "NO"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

        S3Object mockS3Object = mock(S3Object.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.getObject(anyString(), anyString())).thenReturn(mockS3Object);

        String dummyContent = "Hello World !!!\n";
        InputStream dummyInputStream = new ByteArrayInputStream(dummyContent.getBytes());
        S3ObjectInputStream dummyS3ObjectInputStream = new S3ObjectInputStream(dummyInputStream, null);
        when(mockS3Object.getObjectContent()).thenReturn(dummyS3ObjectInputStream);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                                                                    mockConnection,
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
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "READ_FILE"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, null)); /* not relevant to this test */
        properties.add(new Property(null, null)); /* not relevant to this test */
        properties.add(new Property(null, null)); /* not relevant to this test */
        properties.add(new Property("encodeBase64", "YES"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

        S3Object mockS3Object = mock(S3Object.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.getObject(anyString(), anyString())).thenReturn(mockS3Object);

        String dummyContent = "Hello World !!!\n";
        InputStream dummyInputStream = new ByteArrayInputStream(dummyContent.getBytes());
        S3ObjectInputStream dummyS3ObjectInputStream = new S3ObjectInputStream(dummyInputStream, null);
        when(mockS3Object.getObjectContent()).thenReturn(dummyS3ObjectInputStream);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                mockConnection,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    Map<String, Object> body = (Map<String, Object>) result.getBody();
                    assertEquals(new String(Base64.encode(dummyContent.getBytes())), body.get("fileData"));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteFile() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "DELETE_FILE"));
        properties.add(new Property("bucketName", "bucket_name"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

        AmazonS3 mockConnection = mock(AmazonS3.class);
        doNothing().when(mockConnection).deleteObject(anyString(), anyString());

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                                                                    mockConnection,
                                                                    datasourceConfiguration,
                                                                    actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    Map<String, String> node = (Map<String, String>) result.getBody();
                    assertEquals("File deleted successfully", node.get("status"));
                })
                .verifyComplete();
    }

    @Test
    public void testListFilesWithPrefix() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "LIST"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, "NO"));
        properties.add(new Property(null, null));
        properties.add(new Property(null, "Hel"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                mockConnection,
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
    public void testListFilesWithUrl() throws MalformedURLException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "LIST"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property("getSignedUrl", "YES"));
        properties.add(new Property("urlExpiry", "1000"));
        properties.add(new Property(null, ""));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                mockConnection,
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
    public void testListFilesWithUrlAndNullDuration() throws MalformedURLException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "LIST"));
        properties.add(new Property("bucketName", "bucket_name"));
        properties.add(new Property(null, "YES"));
        properties.add(new Property(null, null)); /* duration property value is null */
        properties.add(new Property(null, ""));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                mockConnection,
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
}
