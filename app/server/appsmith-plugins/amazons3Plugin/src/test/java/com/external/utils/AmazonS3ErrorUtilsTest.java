package com.external.utils;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Endpoint;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

public class AmazonS3ErrorUtilsTest {

    private String accessKey;
    private String secretKey;
    private String region;
    private String serviceProvider;

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

}
