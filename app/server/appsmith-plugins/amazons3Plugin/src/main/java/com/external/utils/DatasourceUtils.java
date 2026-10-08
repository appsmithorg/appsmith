package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.S3ErrorMessages;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    /** The region an Amazon S3 client is created in. Requests to buckets in other regions are redirected. */
    private static final Region AMAZON_DEFAULT_REGION = Region.US_WEST_2;

    /**
     * The signing region of a custom-endpoint provider whose datasource does not name a region (MinIO and other). It
     * is the region MinIO uses when none is configured, and servers that are not configured with a region accept any.
     * Ref: https://docs.min.io/docs/how-to-use-aws-sdk-for-java-with-minio-server.html
     */
    private static final Region DEFAULT_CUSTOM_ENDPOINT_REGION = Region.US_EAST_1;

    /** Scheme used for an endpoint entered without one. */
    private static final String DEFAULT_ENDPOINT_SCHEME = "https";

    /** A region name: one DNS label of letters, digits and hyphens. */
    private static final Pattern REGION_NAME = Pattern.compile("[A-Za-z0-9-]{1,63}");

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
     * Everything that determines how the plugin talks to an S3 service, derived once from the datasource so that the
     * client, the presigner and the unsigned URLs cannot disagree. {@link #toString()} shows no credentials.
     *
     * @param credentialsProvider   static credentials from the datasource's access key and secret key
     * @param region                the region requests and unsigned URLs are signed for; for Amazon S3, presigned URLs
     *                              are signed for each bucket's own region when it can be determined
     * @param endpoint              the service endpoint as {@link DatasourceUtils#serviceEndpoint} derives it from the datasource's
     *                              endpoint, or null for Amazon S3, whose endpoint the SDK resolves
     * @param pathStyleAccess       whether the bucket goes in the path (true) or in the host name (false)
     * @param resolveBucketRegions  whether each bucket's own region is looked up; for Amazon S3, where buckets live
     *                              in many regions behind one datasource
     */
    public record S3ConnectionSettings(
            AwsCredentialsProvider credentialsProvider,
            Region region,
            URI endpoint,
            boolean pathStyleAccess,
            boolean resolveBucketRegions) {
        @Override
        public String toString() {
            return "S3ConnectionSettings[region=" + region.id() + ", endpoint="
                    + (endpoint == null ? null : endpoint.getScheme() + "://" + endpoint.getHost())
                    + ", pathStyleAccess="
                    + pathStyleAccess + ", resolveBucketRegions=" + resolveBucketRegions + "]";
        }
    }

    /**
     * Opens a connection to the S3 service described by the datasource.
     *
     * @throws AppsmithPluginException when the credentials cannot be parsed, the service provider properties are
     *                                 missing, the endpoint does not match the provider's endpoint pattern or is not a
     *                                 URI with a host, or the region is not a region name.
     * @throws RuntimeException        when the endpoint is missing, or the https proxy host is not a host name.
     */
    public static S3Connection createConnection(DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
        return S3Connection.open(getS3ConnectionSettings(datasourceConfiguration));
    }

    /**
     * Derives the connection settings from the datasourceConfiguration provided by user.
     *
     * @throws AppsmithPluginException when the credentials cannot be parsed, the service provider properties are
     *                                 missing, the endpoint does not match the provider's endpoint pattern or is not a
     *                                 URI with a host, or the region is not a region name.
     * @throws RuntimeException        when the endpoint is missing.
     */
    public static S3ConnectionSettings getS3ConnectionSettings(DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
        log.debug(Thread.currentThread().getName() + ": getS3ConnectionSettings action called.");
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        String accessKey = authentication.getUsername();
        String secretKey = authentication.getPassword();
        AwsCredentialsProvider credentialsProvider;
        try {
            credentialsProvider = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        } catch (NullPointerException | IllegalArgumentException e) {
            // AwsBasicCredentials rejects a null or blank key with a NullPointerException.
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.AWS_CREDENTIALS_PARSING_ERROR_MSG,
                    e.getMessage());
        }

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
         * Amazon S3 buckets live in many regions behind one datasource: the client is created in a default region and
         * follows the service's redirects to a bucket's own region, and presigned URLs are signed for the region the
         * bucket is found in.
         *
         * No mention of such redirects could be found within the documentation of other listed S3 service providers
         * like Upcloud, Wasabi, Dream Objects, or Digital Ocean Spaces. For these service providers, the region
         * information is chained in the endpoint URL. Hence, the endpoint URL is used to extract the exact object
         * storage region.
         *
         * Apart from the listed S3 services - AWS, Upcloud, Wasabi, Dream Objects and Digital Ocean spaces, any other
         * service provider falls in the category `other` and there is no special handling defined for it since we
         * cannot assume any information about them beforehand. For this S3 service provider type region must be
         * explicitly provided.
         */
        if (s3ServiceProvider.equals(AMAZON)) {
            return new S3ConnectionSettings(credentialsProvider, AMAZON_DEFAULT_REGION, null, false, true);
        }

        String endpoint = datasourceConfiguration
                .getEndpoints()
                .get(CUSTOM_ENDPOINT_INDEX)
                .getHost();
        String region = "";
        boolean pathStyleAccess = false;

        switch (s3ServiceProvider) {
            case GOOGLE_CLOUD_STORAGE:
                region = AUTO;
                break;
            case UPCLOUD:
                region = getRegionFromEndpointPattern(
                        endpoint, UPCLOUD_URL_ENDPOINT_PATTERN, UPCLOUD_REGION_GROUP_INDEX);

                break;
            case WASABI:
                region = getRegionFromEndpointPattern(endpoint, WASABI_URL_ENDPOINT_PATTERN, WASABI_REGION_GROUP_INDEX);

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
                /**
                 * Minio server can be configured to work both ways - with or without region attribute. Hence, it is upto
                 * the user to know whether the Minio server they want to connect to has been configured with a region
                 * or not. A blank region falls back to DEFAULT_CUSTOM_ENDPOINT_REGION below.
                 */
                region = getUserProvidedRegion(properties);

                /* Ref: https://docs.min.io/docs/how-to-use-aws-sdk-for-java-with-minio-server.html */
                pathStyleAccess = true;

                break;
            default:
                region = getValueSafelyFromPropertyList(
                        properties, CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX, String.class, "");
        }

        String regionName = StringUtils.isBlank(region) ? DEFAULT_CUSTOM_ENDPOINT_REGION.id() : region.trim();
        if (!isRegionName(regionName)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, S3ErrorMessages.INVALID_REGION_ERROR_MSG);
        }
        URI endpointUri = toEndpointUri(endpoint);
        boolean bucketInPath = pathStyleAccess || isIpAddress(endpointUri.getHost());

        return new S3ConnectionSettings(
                credentialsProvider,
                Region.of(regionName),
                serviceEndpoint(endpointUri, bucketInPath),
                bucketInPath,
                false);
    }

    /** Whether the value is a region name: one DNS label of letters, digits and hyphens. */
    static boolean isRegionName(String value) {
        return value != null && REGION_NAME.matcher(value).matches();
    }

    /**
     * Whether the host is an IP address: an IPv6 literal in brackets, or four dot-separated numbers from 0 to 255. A
     * bucket name cannot be prefixed to an IP address, so such an endpoint takes the bucket in the path.
     */
    static boolean isIpAddress(String host) {
        if (host == null) {
            return false;
        }
        if (host.startsWith("[")) {
            return true;
        }
        String[] parts = host.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        for (String part : parts) {
            try {
                int value = Integer.parseInt(part);
                if (value < 0 || value > 255) {
                    return false;
                }
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return true;
    }

    /**
     * The endpoint as a URI; an endpoint entered without a scheme uses HTTPS.
     *
     * @throws AppsmithPluginException when the endpoint is not a URI or names no host. The error does not repeat the
     *                                 endpoint.
     */
    static URI toEndpointUri(String endpoint) throws AppsmithPluginException {
        String endpointWithScheme = endpoint.contains("://") ? endpoint : DEFAULT_ENDPOINT_SCHEME + "://" + endpoint;
        URI endpointUri;
        try {
            endpointUri = new URI(endpointWithScheme);
        } catch (URISyntaxException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
        }
        if (endpointUri.getHost() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
        }
        return endpointUri;
    }

    /**
     * The endpoint requests and URLs are addressed to: the endpoint's scheme, host and port, and, when the bucket goes
     * in the path, the endpoint's path without trailing slashes as a prefix of every path. The endpoint's query,
     * fragment and user info are not part of it, and neither is its path when the bucket goes in the host name. On such
     * a connection the SDK puts some buckets in the path instead, such as a name with upper-case letters or, on an
     * https endpoint, a dotted name; their requests and URLs have no path prefix either.
     */
    static URI serviceEndpoint(URI endpointUri, boolean bucketInPath) {
        StringBuilder serviceEndpoint =
                new StringBuilder(endpointUri.getScheme()).append("://").append(endpointUri.getHost());
        if (endpointUri.getPort() >= 0) {
            serviceEndpoint.append(':').append(endpointUri.getPort());
        }
        if (bucketInPath && endpointUri.getRawPath() != null) {
            serviceEndpoint.append(StringUtils.stripEnd(endpointUri.getRawPath(), "/"));
        }
        return URI.create(serviceEndpoint.toString());
    }

    private static String getUserProvidedRegion(List<Property> properties) {
        return getValueSafelyFromPropertyList(properties, CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX, String.class);
    }

    /**
     * This method checks if the S3 endpoint URL has correct format and extracts region information from it. A scheme
     * the endpoint starts with is not part of the region.
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
            String region = matcher.group(regionGroupIndex);
            int schemeEnd = region.indexOf("://");
            return schemeEnd < 0 ? region : region.substring(schemeEnd + "://".length());
        }

        /* Code flow is never expected to reach here. */
        throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
    }
}
