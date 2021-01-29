package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.annotation.JsonAppend;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.SQLOutput;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

@Slf4j
public class S3PluginTest {
    private static String accessKey;
    private static String secretKey;
    private static String region;

    @BeforeClass
    public static void setUp() {
        accessKey = "access_key";
        secretKey = "secret_key";
        region = "ap-south-1";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(accessKey);
        authDTO.setPassword(secretKey);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(new Property("region", region));
        dsConfig.setProperties(properties);
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

        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();
        Mono<S3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    Assert.assertNotEquals(0, res.size());
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

        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();
        Mono<S3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    Assert.assertNotEquals(0, res.size());
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceWithMissingRegion() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        datasourceConfiguration.setProperties(properties);

        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();
        Mono<S3Plugin.S3PluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);

        StepVerifier.create(pluginExecutorMono)
                .assertNext(executor -> {
                    Set<String> res = executor.validateDatasource(datasourceConfiguration);
                    Assert.assertNotEquals(0, res.size());
                })
                .verifyComplete();
    }

    @Test
    public void testTestDatasourceWithFalseCredentials() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();
        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(datasourceTestResult -> {
                    assertNotEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();
    }
    
    @Test
    public void testListFilesInBucket() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "LIST"));
        properties.add(new Property("bucketName", "bucket_name"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

        ObjectListing mockObjectListing = mock(ObjectListing.class);
        AmazonS3 mockConnection = mock(AmazonS3.class);
        when(mockConnection.listObjects(anyString())).thenReturn(mockObjectListing);

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
                    final JsonNode node = ((ArrayNode) result.getBody());
                    assertTrue(result.getIsExecutionSuccess());
                    assertArrayEquals(
                            new String[]{
                                    dummyKey1,
                                    dummyKey2
                            },
                            node.findValuesAsText("List of Files").toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testUploadFileFromBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String dummyBody = "";
        actionConfiguration.setBody(dummyBody);

        String dummyPath = "path";
        actionConfiguration.setPath(dummyPath);

        List<Property> properties = new ArrayList<>();
        properties.add(new Property("action", "UPLOAD_FILE_FROM_BODY"));
        properties.add(new Property("bucketName", "bucket_name"));
        actionConfiguration.setPluginSpecifiedTemplates(properties);

        AmazonS3 connection = pluginExecutor.datasourceCreate(datasourceConfiguration).block();
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(
                connection,
                datasourceConfiguration,
                actionConfiguration);

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> {
                    Assert.assertTrue(e.getMessage().contains("The AWS Access Key Id you provided does not exist in " +
                            "our records"));
                    return true;
                }).verify();
    }

    @Test
    public void testReadFileFromPath() {
        
    }
}
