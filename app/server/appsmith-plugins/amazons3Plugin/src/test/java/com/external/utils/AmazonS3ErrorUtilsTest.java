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
        this.errorDescription = new HashMap<>();
        this.errorDescription.put( "AmbiguousGrantByEmailAddress", "The email address that you provided is associated with more than one account." );
        this.errorDescription.put( "AuthorizationHeaderMalformed", "The authorization header that you provided is not valid." );
        this.errorDescription.put( "BadDigest", "The Content-MD5 or checksum value that you specified did not match what the server received." );
        this.errorDescription.put( "BucketAlreadyExists", "The requested bucket name is not available. The bucket namespace is shared by all users of the system. Specify a different name and try again." );
        this.errorDescription.put( "BucketAlreadyOwnedByYou", "The bucket that you tried to create already exists, and you own it. Amazon S3 returns this error in all AWS Regions except in the US East (N. Virginia) Region (us-east-1). For legacy compatibility, if you re-create an existing bucket that you already own in us-east-1, Amazon S3 returns 200 OK and resets the bucket access control lists (ACLs).For Amazon S3 on Outposts, the bucket that you tried to create already exists in your Outpost and you own it." );
        this.errorDescription.put( "BucketNotEmpty", "The bucket that you tried to delete is not empty." );
        this.errorDescription.put( "ClientTokenConflict", "Your Multi-Region Access Point idempotency token was already used for a different request." );
        this.errorDescription.put( "CredentialsNotSupported", "This request does not support credentials." );
        this.errorDescription.put( "CrossLocationLoggingProhibited", "Cross-Region logging is not allowed. Buckets in one AWS Region cannot log information to a bucket in another Region." );
        this.errorDescription.put( "EntityTooSmall", "Your proposed upload is smaller than the minimum allowed object size." );
        this.errorDescription.put( "EntityTooLarge", "Your proposed upload exceeds the maximum allowed object size. For more information, see Amazon Simple Storage Service endpoints and quotas in the AWS General Reference." );
        this.errorDescription.put( "ExpiredToken", "The provided token has expired." );
        this.errorDescription.put( "IllegalLocationConstraintException", "You are trying to access a bucket from a different Region than where the bucket exists. To avoid this error, use the --region option. For example: aws s3 cp awsexample.txt s3://DOC-EXAMPLE-BUCKET/ --region ap-east-1." );
        this.errorDescription.put( "IllegalVersioningConfigurationException", "The versioning configuration specified in the request is not valid." );
        this.errorDescription.put( "IncompleteBody", "You did not provide the number of bytes specified by the Content-Length HTTP header." );
        this.errorDescription.put( "IncorrectNumberOfFilesInPostRequest", "POST requires exactly one file upload per request." );
        this.errorDescription.put( "InlineDataTooLarge", "The inline data exceeds the maximum allowed size." );
        this.errorDescription.put( "InternalError", "An internal error occurred. Try again." );
        this.errorDescription.put( "InvalidAccessKeyId", "The AWS access key ID that you provided does not exist in our records." );
        this.errorDescription.put( "InvalidAccessPoint", "The specified access point name or account is not valid." );
        this.errorDescription.put( "InvalidAccessPointAliasError", "The specified access point alias name is not valid." );
        this.errorDescription.put( "InvalidAddressingHeader", "You must specify the Anonymous role." );
        this.errorDescription.put( "InvalidArgument", "This error might occur for the following reasons: \nThe specified argument was not valid.\nThe request was missing a required header.\n The specified argument was incomplete or in the wrong format.\nThe specified argument must have a length greater than or equal to 3." );
        this.errorDescription.put( "InvalidBucketAclWithObjectOwnership", "Bucket cannot have ACLs set with ObjectOwnership's BucketOwnerEnforced setting." );
        this.errorDescription.put( "InvalidBucketName", "The specified bucket is not valid." );
        this.errorDescription.put( "InvalidBucketState", "The request is not valid for the current state of the bucket." );
        this.errorDescription.put( "InvalidDigest", "The Content-MD5 or checksum value that you specified is not valid." );
        this.errorDescription.put( "InvalidEncryptionAlgorithmError", "The encryption request that you specified is not valid. The valid value is AES256." );
        this.errorDescription.put( "InvalidLocationConstraint", "The specified location (Region) constraint is not valid. For more information about selecting a Region for your buckets, see Buckets overview." );
        this.errorDescription.put( "InvalidObjectState", "The operation is not valid for the current state of the object." );
        this.errorDescription.put( "InvalidPart", "One or more of the specified parts could not be found. The part might not have been uploaded, or the specified entity tag might not have matched the part's entity tag." );
        this.errorDescription.put( "InvalidPartOrder", "The list of parts was not in ascending order. The parts list must be specified in order by part number." );
        this.errorDescription.put( "InvalidPayer", "All access to this object has been disabled. For further assistance, see Contact Us." );
        this.errorDescription.put( "InvalidPolicyDocument", "The content of the form does not meet the conditions specified in the policy document." );
        this.errorDescription.put( "InvalidRange", "The requested range is not valid for the request. Try another range." );
        this.errorDescription.put( "InvalidSecurity", "The provided security credentials are not valid." );
        this.errorDescription.put( "InvalidSOAPRequest", "The SOAP request body is not valid." );
        this.errorDescription.put( "InvalidStorageClass", "The storage class that you specified is not valid." );
        this.errorDescription.put( "InvalidTargetBucketForLogging", "The target bucket for logging either does not exist, is not owned by you, or does not have the appropriate grants for the log-delivery group." );
        this.errorDescription.put( "InvalidToken", "The provided token is malformed or otherwise not valid." );
        this.errorDescription.put( "InvalidURI", "The specified URI couldn't be parsed." );
        this.errorDescription.put( "KeyTooLongError", "Your key is too long." );
        this.errorDescription.put( "MalformedACLError", "The ACL that you provided was not well formed or did not validate against our published schema." );
        this.errorDescription.put( "MalformedPOSTRequest", "The body of your POST request is not well-formed multipart/form-data." );
        this.errorDescription.put( "MalformedXML", "The XML that you provided was not well formed or did not validate against our published schema." );
        this.errorDescription.put( "MaxMessageLengthExceeded", "Your request was too large." );
        this.errorDescription.put( "MaxPostPreDataLengthExceededError", "Your POST request fields preceding the upload file were too large." );
        this.errorDescription.put( "MetadataTooLarge", "Your metadata headers exceed the maximum allowed metadata size." );
        this.errorDescription.put( "MethodNotAllowed", "The specified method is not allowed against this resource." );
        this.errorDescription.put( "MissingAttachment", "A SOAP attachment was expected, but none was found." );
        this.errorDescription.put( "MissingContentLength", "You must provide the Content-Length HTTP header." );
        this.errorDescription.put( "MissingRequestBodyError", "You sent an empty XML document as a request." );
        this.errorDescription.put( "MissingSecurityElement", "The SOAP 1.1 request is missing a security element." );
        this.errorDescription.put( "MissingSecurityHeader", "Your request is missing a required header." );
        this.errorDescription.put( "NoLoggingStatusForKey", "There is no such thing as a logging status subresource for a key." );
        this.errorDescription.put( "NoSuchBucket", "The specified bucket does not exist." );
        this.errorDescription.put( "NoSuchBucketPolicy", "The specified bucket does not have a bucket policy." );
        this.errorDescription.put( "NoSuchCORSConfiguration", "The specified bucket does not have a CORS configuration." );
        this.errorDescription.put( "NoSuchKey", "The specified key does not exist." );
        this.errorDescription.put( "NoSuchLifecycleConfiguration", "The specified lifecycle configuration does not exist." );
        this.errorDescription.put( "NoSuchMultiRegionAccessPoint", "The specified Multi-Region Access Point does not exist." );
        this.errorDescription.put( "NoSuchWebsiteConfiguration", "The specified bucket does not have a website configuration." );
        this.errorDescription.put( "NoSuchTagSet", "The specified tag does not exist." );
        this.errorDescription.put( "NoSuchUpload", "The specified multipart upload does not exist. The upload ID might not be valid, or the multipart upload might have been aborted or completed." );
        this.errorDescription.put( "NoSuchVersion", "The version ID specified in the request does not match an existing version." );
        this.errorDescription.put( "NotImplemented", "A header that you provided implies functionality that is not implemented." );
        this.errorDescription.put( "NotModified", "The resource was not changed." );
        this.errorDescription.put( "NotSignedUp", "Your account is not signed up for the Amazon S3 service. You must sign up before you can use Amazon S3. You can sign up at the following URL: https://aws.amazon.com/s3" );
        this.errorDescription.put( "OwnershipControlsNotFoundError", "The bucket ownership controls were not found." );
        this.errorDescription.put( "OperationAborted", "A conflicting conditional operation is currently in progress against this resource. Try again." );
        this.errorDescription.put( "PermanentRedirect", "The bucket that you are attempting to access must be addressed using the specified endpoint. Send all future requests to this endpoint." );
        this.errorDescription.put( "PreconditionFailed", "At least one of the preconditions that you specified did not hold." );
        this.errorDescription.put( "Redirect", "Temporary redirect. You are being redirected to the bucket while the Domain Name System (DNS) server is being updated." );
        this.errorDescription.put( "RequestHeaderSectionTooLarge", "The request header and query parameters used to make the request exceed the maximum allowed size." );
        this.errorDescription.put( "RequestIsNotMultiPartContent", "A bucket POST request must be of the enclosure-type multipart/form-data." );
        this.errorDescription.put( "RequestTimeout", "Your socket connection to the server was not read from or written to within the timeout period." );
        this.errorDescription.put( "RequestTimeTooSkewed", "The difference between the request time and the server's time is too large." );
        this.errorDescription.put( "RequestTorrentOfBucketError", "Requesting the torrent file of a bucket is not permitted." );
        this.errorDescription.put( "RestoreAlreadyInProgress", "The object restore is already in progress." );
        this.errorDescription.put( "ServerSideEncryptionConfigurationNotFoundError", "The server-side encryption configuration was not found." );
        this.errorDescription.put( "ServiceUnavailable", "Reduce your request rate." );
        this.errorDescription.put( "SignatureDoesNotMatch", "The request signature that the server calculated does not match the signature that you provided. Check your AWS secret access key and signing method. For more information, see REST Authentication and SOAP Authentication." );
        this.errorDescription.put( "SlowDown", "Reduce your request rate." );
        this.errorDescription.put( "TemporaryRedirect", "You are being redirected to the bucket while the Domain Name System (DNS) server is being updated." );
        this.errorDescription.put( "TokenRefreshRequired", "The provided token must be refreshed." );
        this.errorDescription.put( "TooManyAccessPoints", "You have attempted to create more access points than are allowed for an account. For more information, see Amazon Simple Storage Service endpoints and quotas in the AWS General Reference." );
        this.errorDescription.put( "TooManyBuckets", "You have attempted to create more buckets than are allowed for an account. For more information, see Amazon Simple Storage Service endpoints and quotas in the AWS General Reference." );
        this.errorDescription.put( "TooManyMultiRegionAccessPointregionsError", "You have attempted to create a Multi-Region Access Point with more Regions than are allowed for an account. For more information, see Amazon Simple Storage Service endpoints and quotas in the AWS General Reference." );
        this.errorDescription.put( "TooManyMultiRegionAccessPoints", "You have attempted to create more Multi-Region Access Points than are allowed for an account. For more information, see Amazon Simple Storage Service endpoints and quotas in the AWS General Reference." );
        this.errorDescription.put( "UnexpectedContent", "This request contains unsupported content." );
        this.errorDescription.put( "UnresolvableGrantByEmailAddress", "The email address that you provided does not match any account on record." );
        this.errorDescription.put( "UserKeyMustBeSpecified", "The bucket POST request must contain the specified field name. If it is specified, check the order of the fields." );
        this.errorDescription.put( "NoSuchAccessPoint", "The specified access point does not exist." );
        this.errorDescription.put( "InvalidTag", "Your request contains tag input that is not valid. For example, your request might contain duplicate keys, keys or values that are too long, or system tags." );
        this.errorDescription.put( "MalformedPolicy", "Your policy contains a principal that is not valid." );

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
        AmazonServiceException amazonServiceException;
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        Set<String> errorCodes = errorDescription.keySet();
        for (String code : errorCodes) {
            amazonServiceException = new AmazonS3Exception(errorDescription.get(code));
            String errorMessage = errorUtil.getReadableError(amazonServiceException);
            assertNotNull(errorMessage);
            assertEquals(errorMessage,null + ": " + errorDescription.get(code));
        }
    }

    @Test
    public void getReadableErrorWithAmazonS3Exception() throws InstantiationException {
        AmazonS3Exception amazonS3Exception;
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        Set<String> errorCodes = errorDescription.keySet();
        for (String code : errorCodes) {
            amazonS3Exception = new AmazonS3Exception(errorDescription.get(code));
            String errorMessage = errorUtil.getReadableError(amazonS3Exception);
            assertNotNull(errorMessage);
            assertEquals(errorMessage,null + ": "+errorDescription.get(code));
        }

    }

    @Test
    public void testExecuteCommonForAmazonS3Exception() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        AmazonS3 mockConnection = Mockito.mock(AmazonS3.class);
        Method executeCommon = AmazonS3Plugin.S3PluginExecutor.class
                .getDeclaredMethod("executeCommon", AmazonS3.class,
                        DatasourceConfiguration.class, ActionConfiguration.class);
        executeCommon.setAccessible(true);


        for (String code : errorDescription.keySet()){
            ActionConfiguration mockAction = Mockito.mock(ActionConfiguration.class);

            when(mockAction.getFormData()).thenThrow(new AmazonS3Exception(errorDescription.get(code)));
            Mono<ActionExecutionResult> invoke = (Mono<ActionExecutionResult>) executeCommon
                    .invoke(pluginExecutor, mockConnection, datasourceConfiguration, mockAction);
            ActionExecutionResult actionExecutionResult = invoke.block();
            assertEquals(null + ": "+ errorDescription.get(code) , actionExecutionResult.getReadableError());
        }




    }

    @Test
    public void testExecuteCommonForAmazonServiceException() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        AmazonS3Plugin.S3PluginExecutor pluginExecutor = new AmazonS3Plugin.S3PluginExecutor();
        AmazonS3 mockConnection = Mockito.mock(AmazonS3.class);
        Method executeCommon = AmazonS3Plugin.S3PluginExecutor.class
                .getDeclaredMethod("executeCommon", AmazonS3.class,
                        DatasourceConfiguration.class, ActionConfiguration.class);
        executeCommon.setAccessible(true);


        for (String code : errorDescription.keySet()){
            ActionConfiguration mockAction = Mockito.mock(ActionConfiguration.class);

            when(mockAction.getFormData()).thenThrow(new AmazonServiceException(errorDescription.get(code)));
            Mono<ActionExecutionResult> invoke = (Mono<ActionExecutionResult>) executeCommon
                    .invoke(pluginExecutor, mockConnection, datasourceConfiguration, mockAction);
            ActionExecutionResult actionExecutionResult = invoke.block();
            assertEquals(null + ": "+ errorDescription.get(code) , actionExecutionResult.getReadableError());
        }
    }


}