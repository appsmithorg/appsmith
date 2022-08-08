package com.external.utils;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.ActionExecutionResult;
import com.external.plugins.AmazonS3Plugin;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Set;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.when;

public class AmazonS3ErrorUtilsTest {

    private String accessKey;
    private String secretKey;
    private String region;
    private String serviceProvider;

    private Map<String,String> errorDescription;
    @Before
    public void setUp(){
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
    public void getReadableErrorWithAmazonServiceException() throws InstantiationException {
        String errorMessage = "The specified access point name or account is not valid.";
        String errorCode = "InvalidAccessPoint";
        AmazonServiceException amazonServiceException = new AmazonS3Exception(errorMessage);
        amazonServiceException.setErrorCode(errorCode);
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonServiceException);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage,errorCode+": "+errorMessage);

    }

    @Test
    public void getReadableErrorWithAmazonS3Exception() throws InstantiationException {
        String errorMessage = "Reduce your request rate.";
        String errorCode = "SlowDown";
        AmazonS3Exception amazonS3Exception = new AmazonS3Exception(errorMessage);
        amazonS3Exception.setErrorCode(errorCode);
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonS3Exception);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage,errorCode+": "+errorMessage);

    }

    @Test
    public void testExecuteCommonForAmazonS3Exception() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {

        String errorMessage = "The requested range is not valid for the request. Try another range.";
        String errorCode = "InvalidRange";
        AmazonS3Exception amazonS3Exception = new AmazonS3Exception(errorMessage);
        amazonS3Exception.setErrorCode(errorCode);

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        AmazonS3 mockConnection = Mockito.mock(AmazonS3.class);
        Method executeCommon = AmazonS3Plugin.S3PluginExecutor.class
                .getDeclaredMethod("executeCommon", AmazonS3.class,
                        DatasourceConfiguration.class, ActionConfiguration.class);
        executeCommon.setAccessible(true);

        ActionConfiguration mockAction = Mockito.mock(ActionConfiguration.class);
        when(mockAction.getFormData()).thenThrow(amazonS3Exception);
        Mono<ActionExecutionResult> invoke = (Mono<ActionExecutionResult>) executeCommon
                    .invoke(pluginExecutor, mockConnection, datasourceConfiguration, mockAction);
        ActionExecutionResult actionExecutionResult = invoke.block();
        assertEquals(actionExecutionResult.getReadableError(),errorCode+": "+errorMessage);




    }

    @Test
    public void testExecuteCommonForAmazonServiceException() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        String errorMessage =  "The version ID specified in the request does not match an existing version.";
        String errorCode = "NoSuchVersion";
        AmazonServiceException amazonServiceException = new AmazonServiceException(errorMessage);
        amazonServiceException.setErrorCode(errorCode);

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        AmazonS3 mockConnection = Mockito.mock(AmazonS3.class);
        Method executeCommon = AmazonS3Plugin.S3PluginExecutor.class
                .getDeclaredMethod("executeCommon", AmazonS3.class,
                        DatasourceConfiguration.class, ActionConfiguration.class);
        executeCommon.setAccessible(true);

        ActionConfiguration mockAction = Mockito.mock(ActionConfiguration.class);
        when(mockAction.getFormData()).thenThrow(amazonServiceException);
        Mono<ActionExecutionResult> invoke = (Mono<ActionExecutionResult>) executeCommon
                .invoke(pluginExecutor, mockConnection, datasourceConfiguration, mockAction);
        ActionExecutionResult actionExecutionResult = invoke.block();
        assertEquals(actionExecutionResult.getReadableError(),errorCode+": "+errorMessage);

    }


}
