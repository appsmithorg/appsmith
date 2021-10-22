package com.external.utils;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.AmazonS3Plugin;
import org.apache.commons.lang.StringUtils;

import java.util.List;

import static com.amazonaws.regions.Regions.DEFAULT_REGION;
import static com.external.plugins.AmazonS3Plugin.CUSTOM_ENDPOINT_INDEX;
import static com.external.plugins.AmazonS3Plugin.CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX;
import static com.external.plugins.AmazonS3Plugin.S3ServiceProvider.AMAZON;
import static com.external.plugins.AmazonS3Plugin.S3_SERVICE_PROVIDER_PROPERTY_INDEX;

public class DatasourceUtils {
    public static AmazonS3ClientBuilder getS3ClientBuilder (DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        String accessKey = authentication.getUsername();
        String secretKey = authentication.getPassword();

        BasicAWSCredentials awsCreds;
        try {
            awsCreds = new BasicAWSCredentials(accessKey, secretKey);
        } catch (IllegalArgumentException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "Appsmith server has encountered an error when parsing AWS credentials from datasource: "
                            + e.getMessage()
            );
        }

        AmazonS3ClientBuilder s3ClientBuilder = AmazonS3ClientBuilder
                .standard()
                .withCredentials(new AWSStaticCredentialsProvider(awsCreds));

        List<Property> properties = datasourceConfiguration.getProperties();

        /**
         * Ideally, properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) must always exist, because the `S3
         * Service Provider` dropdown has a default value.
         */
        if (properties == null
                || properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) == null
                || StringUtils.isEmpty((String) properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "Appsmith has failed to fetch the 'S3 Service Provider' field properties. Please reach out to" +
                            " Appsmith customer support to resolve this."
            );
        }

        AmazonS3Plugin.S3ServiceProvider s3ServiceProvider =
                AmazonS3Plugin.S3ServiceProvider.fromString((String) properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());

        if (s3ServiceProvider.equals(AMAZON)) {
            s3ClientBuilder = s3ClientBuilder
                    .withRegion(DEFAULT_REGION)
                    .enableForceGlobalBucketAccess();
        }
        else {
            String endpoint = datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX).getHost();
            String region = "";
            switch(s3ServiceProvider) {
                case UPCLOUD:
                    region = endpoint.split("\\.")[1].trim();

                    break;
                case AMAZON:
                    /* This case can never be reached. Just adding for sake of completeness. */

                    break;
                case DIGITAL_OCEAN_SPACES:
                case DREAM_OBJECTS:
                case WASABI:
                    /* Do nothing */

                    break;
                default:
                    region = (String) properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX).getValue();
            }

            s3ClientBuilder = s3ClientBuilder
                    .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint, region));
        }

        return s3ClientBuilder;
    }
}
