package com.external.utils;

import com.amazonaws.ClientConfiguration;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.S3ErrorMessages;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.amazonaws.regions.Regions.DEFAULT_REGION;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.external.plugins.constants.S3PluginConstants.AUTO;
import static com.external.plugins.constants.S3PluginConstants.CUSTOM_ENDPOINT_INDEX;
import static com.external.plugins.constants.S3PluginConstants.CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX;
import static com.external.plugins.constants.S3PluginConstants.S3_SERVICE_PROVIDER_PROPERTY_INDEX;
import static com.external.utils.DatasourceUtils.S3ServiceProvider.AMAZON;

@Slf4j
public class DatasourceUtils {

    /**
     * Example endpoint : appsmith-test-storage-2.de-fra1.upcloudobjects.com
     * Group 2 match: de-fra1
     */
    public static String UPCLOUD_URL_ENDPOINT_PATTERN = "^([^\\.]+)\\.([^\\.]+)\\.upcloudobjects\\.com$";

    public static int UPCLOUD_REGION_GROUP_INDEX = 2;

    /**
     * Example endpoint : s3.ap-northeast-2.wasabisys.com
     * Group 2 match: ap-northeast-2
     */
    public static String WASABI_URL_ENDPOINT_PATTERN = "^([^\\.]+)\\.([^\\.]+)\\.wasabisys\\.com$";

    public static int WASABI_REGION_GROUP_INDEX = 2;

    /**
     * Example endpoint : fra1.digitaloceanspaces.com
     * Group 1 match: fra1
     */
    public static String DIGITAL_OCEAN_URL_ENDPOINT_PATTERN = "^([^\\.]+)\\.digitaloceanspaces\\.com$";

    public static int DIGITAL_OCEAN_REGION_GROUP_INDEX = 1;

    /**
     * Example endpoint : objects-us-east-1.dream.io
     * Group 1 match: us-east-1
     */
    public static String DREAM_OBJECTS_URL_ENDPOINT_PATTERN = "^objects-([^\\.]+)\\.dream\\.io$";

    public static int DREAM_OBJECTS_REGION_GROUP_INDEX = 1;

    /* This enum lists various types of S3 service providers that we support. */
    public enum S3ServiceProvider {
        AMAZON("amazon-s3"),
        UPCLOUD("upcloud"),
        WASABI("wasabi"),
        DIGITAL_OCEAN_SPACES("digital-ocean-spaces"),
        DREAM_OBJECTS("dream-objects"),
        MINIO("minio"),
        GOOGLE_CLOUD_STORAGE("google-cloud-storage"),
        OTHER("other");

        private String name;

        S3ServiceProvider(String name) {
            this.name = name;
        }

        public static S3ServiceProvider fromString(String name) throws AppsmithPluginException {
            for (S3ServiceProvider s3ServiceProvider : S3ServiceProvider.values()) {
                if (s3ServiceProvider.name.equals(name.toLowerCase())) {
                    return s3ServiceProvider;
                }
            }

            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.S3_SERVICE_PROVIDER_IDENTIFICATION_ERROR_MSG);
        }
    }

    /**
     * This method builds an `AmazonS3ClientBuilder` object from the datasourceConfiguration provided by user. The
     * `AmazonS3ClientBuilder` object can then be used to get a connection object to connect to the S3 service.
     *
     * @param datasourceConfiguration
     * @return AmazonS3ClientBuilder object
     * @throws AppsmithPluginException when (1) there is an error with parsing credentials (2) required
     *                                 datasourceConfiguration properties are missing (3) endpoint URL is found incorrect.
     */
    public static AmazonS3ClientBuilder getS3ClientBuilder(DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
        log.debug(Thread.currentThread().getName() + ": getS3ClientBuilder action called.");
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        String accessKey = authentication.getUsername();
        String secretKey = authentication.getPassword();
        BasicAWSCredentials awsCreds;
        try {
            awsCreds = new BasicAWSCredentials(accessKey, secretKey);
        } catch (IllegalArgumentException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.AWS_CREDENTIALS_PARSING_ERROR_MSG,
                    e.getMessage());
        }

        /* Set credentials in client builder. */
        AmazonS3ClientBuilder s3ClientBuilder =
                AmazonS3ClientBuilder.standard().withCredentials(new AWSStaticCredentialsProvider(awsCreds));

        List<Property> properties = datasourceConfiguration.getProperties();

        /**
         * Return error if no service provider is chosen.
         *
         * Ideally, properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) must always exist, because the `S3
         * Service Provider` dropdown has a default value.
         */
        if (properties == null
                || properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) == null
                || StringUtils.isEmpty((String)
                        properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.DS_S3_SERVICE_PROVIDER_PROPERTIES_FETCHING_ERROR_MSG);
        }

        S3ServiceProvider s3ServiceProvider = S3ServiceProvider.fromString(
                (String) properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());
        /**
         * AmazonS3 provides an attribute `forceGlobalBucketAccessEnabled` that automatically routes the request to a
         * region such that request should succeed.
         * Ref: https://docs.aws.amazon.com/AWSJavaSDK/latest/javadoc/com/amazonaws/services/s3/S3ClientOptions
         * .Builder.html#enableForceGlobalBucketAccess--
         *
         * However, no mention of the attribute `forceGlobalBucketAccessEnabled` could be found within the
         * documentation of other listed S3 service providers like Upcloud, Wasabi, Dream Objects, or Digital Ocean
         * Spaces. Also, some these services failed on usage of this attribute - hence this attribute could not be
         * reliably used for these S3 service providers. For these service providers, the region information is
         * chained in the endpoint URL. Hence, the endpoint URL is used to extract the exact object storage region.
         *
         * Apart from the listed S3 services - AWS, Upcloud, Wasabi, Dream Objects and Digital Ocean spaces, any other
         * service provider falls in the category `other` and there is no special handling defined for it since we
         * cannot assume any information about them beforehand. For this S3 service provider type region must be
         * explicitly provided.
         */
        if (s3ServiceProvider.equals(AMAZON)) {
            s3ClientBuilder = s3ClientBuilder.withRegion(DEFAULT_REGION).enableForceGlobalBucketAccess();
        } else {
            String endpoint = datasourceConfiguration
                    .getEndpoints()
                    .get(CUSTOM_ENDPOINT_INDEX)
                    .getHost();
            String region = "";

            switch (s3ServiceProvider) {
                case AMAZON:
                    /* This case can never be reached because of the if condition above. Just adding for sake of
                    completeness. */

                    break;
                case GOOGLE_CLOUD_STORAGE:
                    region = AUTO;
                    break;
                case UPCLOUD:
                    region = getRegionFromEndpointPattern(
                            endpoint, UPCLOUD_URL_ENDPOINT_PATTERN, UPCLOUD_REGION_GROUP_INDEX);

                    break;
                case WASABI:
                    region = getRegionFromEndpointPattern(
                            endpoint, WASABI_URL_ENDPOINT_PATTERN, WASABI_REGION_GROUP_INDEX);

                    break;
                case DIGITAL_OCEAN_SPACES:
                    region = getRegionFromEndpointPattern(
                            endpoint, DIGITAL_OCEAN_URL_ENDPOINT_PATTERN, DIGITAL_OCEAN_REGION_GROUP_INDEX);

                    break;
                case DREAM_OBJECTS:
                    region = getRegionFromEndpointPattern(
                            endpoint, DREAM_OBJECTS_URL_ENDPOINT_PATTERN, DREAM_OBJECTS_REGION_GROUP_INDEX);

                    break;
                case MINIO:
                    region = getUserProvidedRegion(properties);
                    if (StringUtils.isBlank(region)) {
                        /**
                         * Set a default region in case user has not provided a region.
                         * Minio server can be configured to work both ways - with or without region attribute. Hence,
                         * it is upto the user to know whether the Minio server they want to connect to has been
                         * configured with a region or not.
                         * As per my experimentation, in case the Minio server has not been configured with a region
                         * attribute, then any placeholder value will work. However, I am going with US_EAST_1 here
                         * since this the value that Minio documentation uses to show example applications.
                         * Ref: https://docs.min.io/docs/how-to-use-aws-sdk-for-java-with-minio-server.html
                         */
                        region = Regions.US_EAST_1.getName();
                    }

                    ClientConfiguration clientConfiguration = new ClientConfiguration();
                    clientConfiguration.setSignerOverride("AWSS3V4SignerType");

                    /* Ref: https://docs.min.io/docs/how-to-use-aws-sdk-for-java-with-minio-server.html */
                    s3ClientBuilder = s3ClientBuilder
                            .withPathStyleAccessEnabled(true)
                            .withClientConfiguration(clientConfiguration);

                    break;
                default:
                    region = getValueSafelyFromPropertyList(
                            properties, CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX, String.class, "");
            }

            s3ClientBuilder = s3ClientBuilder.withEndpointConfiguration(
                    new AwsClientBuilder.EndpointConfiguration(endpoint, region));
        }

        return s3ClientBuilder;
    }

    private static String getUserProvidedRegion(List<Property> properties) {
        return getValueSafelyFromPropertyList(properties, CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX, String.class);
    }

    /**
     * This method checks if the S3 endpoint URL has correct format and extracts region information from it.
     *
     * @param endpoint         : endpoint URL
     * @param regex            : expected endpoint URL pattern
     * @param regionGroupIndex : pattern group index for region string
     * @return S3 object storage region.
     * @throws AppsmithPluginException when then endpoint URL does not match the expected regex pattern.
     */
    private static String getRegionFromEndpointPattern(String endpoint, String regex, int regionGroupIndex)
            throws AppsmithPluginException {

        /* endpoint is expected to be non-null at this point */
        if (!endpoint.matches(regex)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
        }

        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(endpoint);
        if (matcher.find()) {
            return matcher.group(regionGroupIndex);
        }

        /* Code flow is never expected to reach here. */
        throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
    }
}
