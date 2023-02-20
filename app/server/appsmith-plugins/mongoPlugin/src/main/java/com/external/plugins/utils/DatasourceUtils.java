package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MongoPluginErrorMessages;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.external.plugins.utils.MongoPluginUtils.urlEncode;

public class DatasourceUtils {

    private static final int DEFAULT_PORT = 27017;

    /*
     * - The regex matches the following two pattern types:
     *   - mongodb+srv://user:pass@some-url/some-db...
     *   - mongodb://user:pass@some-url:port,some-url:port,.../some-db...
     * - It has been grouped like this: (mongodb+srv://)(user):(pass)@(some-url)/(some-db...)?(params...)
     */
    private static final String MONGO_URI_REGEX = "^(mongodb(?:\\+srv)?:\\/\\/)(?:(.+):(.+)@)?([^\\/\\?]+)\\/?([^\\?]+)?\\??(.+)?$";

    private static final int REGEX_GROUP_HEAD = 1;

    private static final int REGEX_GROUP_USERNAME = 2;

    private static final int REGEX_GROUP_PASSWORD = 3;

    private static final int REGEX_HOST_PORT = 4;

    private static final int REGEX_GROUP_DBNAME = 5;

    private static final int REGEX_GROUP_TAIL = 6;

    public static final String KEY_USERNAME = "username";

    public static final String KEY_PASSWORD = "password";

    public static final String KEY_HOST_PORT = "hostPort";

    public static final String KEY_URI_HEAD = "uriHead";

    public static final String KEY_URI_TAIL = "uriTail";

    public static final String KEY_URI_DEFAULT_DBNAME = "defaultDbName";

    private static final String YES = "Yes";

    private static final int DATASOURCE_CONFIG_USE_MONGO_URI_PROPERTY_INDEX = 0;

    private static final int DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX = 1;

    public static boolean isUsingURI(DatasourceConfiguration datasourceConfiguration) {
        List<Property> properties = datasourceConfiguration.getProperties();
        if (properties != null && properties.size() > DATASOURCE_CONFIG_USE_MONGO_URI_PROPERTY_INDEX
                && properties.get(DATASOURCE_CONFIG_USE_MONGO_URI_PROPERTY_INDEX) != null
                && YES.equals(properties.get(DATASOURCE_CONFIG_USE_MONGO_URI_PROPERTY_INDEX).getValue())) {
            return true;
        }

        return false;
    }

    public static boolean hasNonEmptyURI(DatasourceConfiguration datasourceConfiguration) {
        List<Property> properties = datasourceConfiguration.getProperties();
        if (properties != null && properties.size() > DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX
                && properties.get(DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX) != null
                && !StringUtils.isEmpty(properties.get(DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX).getValue())) {
            return true;
        }

        return false;
    }

    public static Map extractInfoFromConnectionStringURI(String uri, String regex) {
        if (uri.matches(regex)) {
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(uri);
            if (matcher.find()) {
                Map extractedInfoMap = new HashMap();
                extractedInfoMap.put(KEY_URI_HEAD, matcher.group(REGEX_GROUP_HEAD));
                extractedInfoMap.put(KEY_USERNAME, matcher.group(REGEX_GROUP_USERNAME));
                extractedInfoMap.put(KEY_PASSWORD, matcher.group(REGEX_GROUP_PASSWORD));
                extractedInfoMap.put(KEY_HOST_PORT, matcher.group(REGEX_HOST_PORT));
                extractedInfoMap.put(KEY_URI_DEFAULT_DBNAME, matcher.group(REGEX_GROUP_DBNAME));
                extractedInfoMap.put(KEY_URI_TAIL, matcher.group(REGEX_GROUP_TAIL));
                return extractedInfoMap;
            }
        }

        return null;
    }

    public static String buildURIFromExtractedInfo(Map extractedInfo, String password) {
        String userInfo = "";
        if (extractedInfo.get(KEY_USERNAME) != null) {
            userInfo += extractedInfo.get(KEY_USERNAME) + ":";
            if (password != null) {
                userInfo += password;
            }
            userInfo += "@";
        }

        final String dbInfo = "/" + (extractedInfo.get(KEY_URI_DEFAULT_DBNAME) == null ? "" : extractedInfo.get(KEY_URI_DEFAULT_DBNAME));

        String tailInfo = (String) (extractedInfo.get(KEY_URI_TAIL) == null ? "" : extractedInfo.get(KEY_URI_TAIL));
        tailInfo = "?" + buildURITail(tailInfo);

        return extractedInfo.get(KEY_URI_HEAD)
                + userInfo
                + extractedInfo.get(KEY_HOST_PORT)
                + dbInfo
                + tailInfo;
    }

    private static String buildURITail(String tailInfo) {
        Map<String, String> optionsMap = new HashMap<>();

        for (final String part : tailInfo.split("[&;]")) {
            if (part.length() == 0) {
                continue;
            }
            int idx = part.indexOf("=");
            if (idx >= 0) {
                String key = part.substring(0, idx).toLowerCase();
                String value = part.substring(idx + 1);
                optionsMap.put(key, value);
            } else {
                optionsMap.put(part.toLowerCase(), "");
            }
        }
        optionsMap.putIfAbsent("authsource", "admin");
        optionsMap.put("minpoolsize", "0");
        return optionsMap
                .entrySet()
                .stream()
                .map(entry -> {
                    if (StringUtils.hasLength(entry.getValue())) {
                        return entry.getKey() + "=" + entry.getValue();
                    } else {
                        return entry.getKey();
                    }
                })
                .collect(Collectors.joining("&"));
    }

    public static String buildClientURI(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        List<Property> properties = datasourceConfiguration.getProperties();
        if (isUsingURI(datasourceConfiguration)) {
            if (hasNonEmptyURI(datasourceConfiguration)) {
                String uriWithHiddenPassword =
                        (String) properties.get(DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX).getValue();
                Map extractedInfo = extractInfoFromConnectionStringURI(uriWithHiddenPassword, MONGO_URI_REGEX);
                if (extractedInfo != null) {
                    String password = ((DBAuth) datasourceConfiguration.getAuthentication()).getPassword();
                    return buildURIFromExtractedInfo(extractedInfo, password);
                } else {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            MongoPluginErrorMessages.CONNECTION_STRING_PARSING_FAILED_ERROR_MSG
                    );
                }
            } else {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        MongoPluginErrorMessages.NO_CONNECTION_STRING_URI_ERROR_MSG
                );
            }
        }

        StringBuilder builder = new StringBuilder();
        final Connection connection = datasourceConfiguration.getConnection();
        final List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();

        // Use SRV mode if using REPLICA_SET, AND a port is not specified in the first endpoint. In SRV mode, the
        // host and port details of individual shards will be obtained from the TXT records of the first endpoint.
        boolean isSrv = Connection.Type.REPLICA_SET.equals(connection.getType())
                && endpoints.get(0).getPort() == null;

        if (isSrv) {
            builder.append("mongodb+srv://");
        } else {
            builder.append("mongodb://");
        }

        boolean hasUsername = false;
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (authentication != null) {
            hasUsername = StringUtils.hasText(authentication.getUsername());
            final boolean hasPassword = StringUtils.hasText(authentication.getPassword());
            if (hasUsername) {
                builder.append(urlEncode(authentication.getUsername()));
            }
            if (hasPassword) {
                builder.append(':').append(urlEncode(authentication.getPassword()));
            }
            if (hasUsername || hasPassword) {
                builder.append('@');
            }
        }

        for (Endpoint endpoint : endpoints) {
            builder.append(endpoint.getHost());
            if (endpoint.getPort() != null) {
                builder.append(':').append(endpoint.getPort());
            } else if (!isSrv) {
                // Connections with +srv should NOT have a port.
                builder.append(':').append(DEFAULT_PORT);
            }
            builder.append(',');
        }

        // Delete the trailing comma.
        builder.deleteCharAt(builder.length() - 1);

        final String authenticationDatabaseName = authentication == null ? null : authentication.getDatabaseName();
        builder.append('/').append(authenticationDatabaseName);

        List<String> queryParams = new ArrayList<>();

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    MongoPluginErrorMessages.DS_SSL_CONFIGURATION_FETCHING_ERROR_MSG
            );
        }

        /*
         * - By default, the driver configures SSL in the preferred mode.
         */
        SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case ENABLED:
                queryParams.add("ssl=true");

                break;
            case DISABLED:
                queryParams.add("ssl=false");

                break;
            case DEFAULT:
                /* do nothing - accept default driver setting */

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        MongoPluginErrorMessages.UNEXPECTED_SSL_OPTION_ERROR_MSG
                );
        }

        if (hasUsername && authentication.getAuthType() != null) {
            queryParams.add("authMechanism=" + authentication.getAuthType().name().replace('_', '-'));
        }

        if (!queryParams.isEmpty()) {
            builder.append('?');
            for (String param : queryParams) {
                builder.append(param).append('&');
            }
            // Delete the trailing ampersand.
            builder.deleteCharAt(builder.length() - 1);
        }

        return builder.toString();
    }

    private static boolean hostStringHasConnectionURIHead(String host) {
        if (!StringUtils.isEmpty(host) && (host.contains("mongodb://") || host.contains("mongodb+srv"))) {
            return true;
        }

        return false;
    }

    public static boolean isHostStringConnectionURI(Endpoint endpoint) {
        if (endpoint != null && hostStringHasConnectionURIHead(endpoint.getHost())) {
            return true;
        }

        return false;
    }

    public static boolean isAuthenticated(DBAuth authentication, String mongoUri) {
        if (authentication != null && authentication.getUsername() != null
                && authentication.getPassword() != null && mongoUri.contains("****")) {

            return true;
        }
        return false;
    }
}
