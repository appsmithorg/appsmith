package com.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import org.apache.commons.lang.StringUtils;
import org.springframework.util.CollectionUtils;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.Authentication.ACCESS_TOKEN;
import static com.appsmith.external.constants.Authentication.API_KEY;
import static com.appsmith.external.constants.Authentication.AUTHORIZATION_HEADER;
import static com.appsmith.external.constants.Authentication.BASIC;
import static com.appsmith.external.constants.Authentication.BEARER_TOKEN;
import static com.appsmith.external.constants.Authentication.OAUTH2;
import static com.appsmith.external.helpers.PluginUtils.getHintMessageForLocalhostUrl;
import static com.appsmith.external.models.ApiKeyAuth.Type.HEADER;
import static com.appsmith.external.models.ApiKeyAuth.Type.QUERY_PARAMS;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.ACTION_CONFIG_ONLY;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.DATASOURCE_AND_ACTION_CONFIG;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.DATASOURCE_CONFIG_ONLY;

public class HintMessageUtils {

    public enum DUPLICATE_ATTRIBUTE_LOCATION {
        ACTION_CONFIG_ONLY,             // Duplicates found in action configuration only
        DATASOURCE_CONFIG_ONLY,         // Duplicates found in datasource configuration only
        DATASOURCE_AND_ACTION_CONFIG    // Duplicates with instance in both datasource and action config
    }

    private enum ATTRIBUTE {
        HEADER,
        PARAM
    }

    private static String HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_DATASOURCE_CONFIG = "API queries linked to this " +
            "datasource may not run as expected because this datasource has duplicate definition(s) for {0}(s): {1}." +
            " Please remove the duplicate definition(s) to resolve this warning. Please note that some of the " +
            "authentication mechanisms also implicitly define a {0}.";

    private static String HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_DEFINED_IN_DATASOURCE_CONFIG = "Your API " +
            "query may not run as expected because its datasource has duplicate definition(s) for {0}(s): {1}. Please" +
            " remove the duplicate definition(s) from the datasource to resolve this warning.";

    private static String HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_CONFIG = "Your API query may not run as " +
            "expected because it has duplicate definition(s) for {0}(s): {1}. Please remove the duplicate definition" +
            "(s) from the ''{2}'' tab to resolve this warning.";

    private static String HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_WITH_INSTANCE_ACROSS_ACTION_AND_DATASOURCE_CONFIG =
            "Your API query may not run as expected because it has duplicate definition(s) for {0}(s): {1}. Please " +
                    "remove the duplicate definition(s) from the ''{2}'' section of either the API query or the " +
                    "datasource. Please note that some of the authentication mechanisms also implicitly define a " +
                    "{0}.";
    
    public static Set<String> getDatasourceHintMessages(DatasourceConfiguration datasourceConfiguration) {
        Set<String> datasourceHintMessages = new HashSet<>();

        /* Get hint message for localhost URL. */
        datasourceHintMessages.addAll(getHintMessageForLocalhostUrl(datasourceConfiguration));

        /**
         * Get datasource specific hint message for duplicate headers. ActionConfiguration parameter is passed as
         * `null` so that the hint message that gets generated is only relevant for the datasource.
         */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateHeadersInDatasource = getAllDuplicateHeaders(null, datasourceConfiguration);
        if (!duplicateHeadersInDatasource.get(DATASOURCE_CONFIG_ONLY).isEmpty()) {
            datasourceHintMessages.add(MessageFormat.format(HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_DATASOURCE_CONFIG,
                    ATTRIBUTE.HEADER.name().toLowerCase(), duplicateHeadersInDatasource.get(DATASOURCE_CONFIG_ONLY)));
        }

        /**
         * Get datasource specific hint message for duplicate query params. ActionConfiguration parameter is passed
         * as `null` so that the hint message that gets generated is only relevant for the datasource.
         */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateParamsInDatasource = getAllDuplicateParams(null, datasourceConfiguration);
        if (!duplicateParamsInDatasource.get(DATASOURCE_CONFIG_ONLY).isEmpty()) {
            datasourceHintMessages.add(MessageFormat.format(HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_DATASOURCE_CONFIG,
                    ATTRIBUTE.PARAM.name().toLowerCase(), duplicateParamsInDatasource.get(DATASOURCE_CONFIG_ONLY)));
        }

        return datasourceHintMessages;
    }

    public static Set<String> getActionHintMessages(ActionConfiguration actionConfiguration,
                                                    DatasourceConfiguration datasourceConfiguration) {
        Set<String> actionHintMessages = new HashSet<>();

        /**
         * Get hint message for localhost URL. For the case of REST API action, the URL is also displayed on the
         * query editor page, hence, this hint message is also added to the action related hint messages - so that
         * it can be displayed on the query editor page too. Same won't apply to other datasources - i.e. datasource
         * attributes generally remain confined to the datasource.
         */
        actionHintMessages.addAll(getHintMessageForLocalhostUrl(datasourceConfiguration));

        /**
         * Get API query page specific hint messages for duplicate headers. It also considers datasource
         * configuration apart from the action configuration since an API inherits all the headers defined in its
         * datasource.
         */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateHeadersMap = getAllDuplicateHeaders(actionConfiguration, datasourceConfiguration);
        if (!duplicateHeadersMap.get(DATASOURCE_CONFIG_ONLY).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_DEFINED_IN_DATASOURCE_CONFIG,
                            ATTRIBUTE.HEADER.name().toLowerCase(),
                            duplicateHeadersMap.get(DATASOURCE_CONFIG_ONLY)
                    )
            );
        }

        if (!duplicateHeadersMap.get(ACTION_CONFIG_ONLY).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_CONFIG,
                            ATTRIBUTE.HEADER.name().toLowerCase(),
                            duplicateHeadersMap.get(ACTION_CONFIG_ONLY),
                            "Headers"
                    )
            );
        }

        if (!duplicateHeadersMap.get(DATASOURCE_AND_ACTION_CONFIG).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_WITH_INSTANCE_ACROSS_ACTION_AND_DATASOURCE_CONFIG,
                            ATTRIBUTE.HEADER.name().toLowerCase(),
                            duplicateHeadersMap.get(DATASOURCE_AND_ACTION_CONFIG),
                            "Headers"
                    )
            );
        }

        /**
         * Get API query page specific hint messages for duplicate query params. It also considers datasource
         * configuration apart from the action configuration since an API inherits all the params defined in its
         * datasource.
         */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateParamsMap = getAllDuplicateParams(actionConfiguration, datasourceConfiguration);
        if (!duplicateParamsMap.get(DATASOURCE_CONFIG_ONLY).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_DEFINED_IN_DATASOURCE_CONFIG,
                            ATTRIBUTE.PARAM.name().toLowerCase(),
                            duplicateParamsMap.get(DATASOURCE_CONFIG_ONLY)
                    )
            );
        }

        if (!duplicateParamsMap.get(ACTION_CONFIG_ONLY).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_IN_ACTION_CONFIG,
                            ATTRIBUTE.PARAM.name().toLowerCase(),
                            duplicateParamsMap.get(ACTION_CONFIG_ONLY),
                            "Params"
                    )
            );
        }

        if (!duplicateParamsMap.get(DATASOURCE_AND_ACTION_CONFIG).isEmpty()) {
            actionHintMessages.add(
                    MessageFormat.format(
                            HINT_MESSAGE_FOR_DUPLICATE_ATTRIBUTE_WITH_INSTANCE_ACROSS_ACTION_AND_DATASOURCE_CONFIG,
                            ATTRIBUTE.PARAM.name().toLowerCase(),
                            duplicateParamsMap.get(DATASOURCE_AND_ACTION_CONFIG),
                            "Params"
                    )
            );
        }

        return actionHintMessages;
    }

    public static Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> getAllDuplicateHeaders(ActionConfiguration actionConfiguration,
                                                                                DatasourceConfiguration datasourceConfiguration) {
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateMap = new HashMap<>();

        Set duplicatesInActionConfigOnly = findDuplicates(getActionHeaders(actionConfiguration));
        duplicateMap.put(ACTION_CONFIG_ONLY, duplicatesInActionConfigOnly);

        Set duplicatesInDsConfigOnly = findDuplicates(getDatasourceHeaders(datasourceConfiguration));
        duplicateMap.put(DATASOURCE_CONFIG_ONLY, duplicatesInDsConfigOnly);

        Set duplicatesAcrossActionAndDsConfig = findDuplicates(getAllHeaders(actionConfiguration,
                datasourceConfiguration));
        duplicatesAcrossActionAndDsConfig.removeAll(duplicatesInActionConfigOnly);
        duplicatesAcrossActionAndDsConfig.removeAll(duplicatesInDsConfigOnly);
        duplicateMap.put(DATASOURCE_AND_ACTION_CONFIG, duplicatesAcrossActionAndDsConfig);
        
        return duplicateMap;
    }

    // Find all duplicate items in a list
    private static Set findDuplicates(List allItems) {
        Set duplicateItems = new HashSet<String>();
        Set uniqueItems = new HashSet<String>();

        allItems.stream()
                .forEach(item -> {
                    if (uniqueItems.contains(item)) {
                        duplicateItems.add(item);
                    }

                    uniqueItems.add(item);
                });

        return duplicateItems;
    }

    private static List getAllHeaders(ActionConfiguration actionConfiguration,
                                      DatasourceConfiguration datasourceConfiguration) {
        List allHeaders = new ArrayList<String>();

        // Get all headers defined in API query editor page.
        allHeaders.addAll(getActionHeaders(actionConfiguration));

        // Get all headers defined in datasource editor page in the headers field.
        allHeaders.addAll(getDatasourceHeaders(datasourceConfiguration));

        return allHeaders;
    }

    // Get all headers defined in API query editor page.
    private static List getActionHeaders(ActionConfiguration actionConfiguration) {
        List headers = new ArrayList<String>();
        if (actionConfiguration != null && !CollectionUtils.isEmpty(actionConfiguration.getHeaders())) {
            headers.addAll(getKeyList(actionConfiguration.getHeaders()));
        }

        return headers;
    }

    // Get all headers defined in datasource editor page in the headers field.
    private static List getDatasourceHeaders(DatasourceConfiguration datasourceConfiguration) {
        List headers = new ArrayList<String>();
        if (datasourceConfiguration != null && !CollectionUtils.isEmpty(datasourceConfiguration.getHeaders())) {
            headers.addAll(getKeyList(datasourceConfiguration.getHeaders()));
        }
        
        // Get authentication related headers.
        headers.addAll(getAuthenticationHeaders(datasourceConfiguration));

        return headers;
    }

    // Get all headers defined implicitly via authentication config for API.
    private static Set<String> getAuthenticationHeaders(DatasourceConfiguration datasourceConfiguration) {

        if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
            return new HashSet<>();
        }

        Set<String> headers = new HashSet<>();

        // Basic auth or bearer token auth adds a header `Authorization`
        if (BASIC.equals(datasourceConfiguration.getAuthentication().getAuthenticationType()) ||
                BEARER_TOKEN.equals(datasourceConfiguration.getAuthentication().getAuthenticationType())) {
            headers.add(AUTHORIZATION_HEADER);
        }

        // Api key based auth where key is supplied via header
        if (API_KEY.equals(datasourceConfiguration.getAuthentication().getAuthenticationType()) &&
                HEADER.equals(((ApiKeyAuth) datasourceConfiguration.getAuthentication()).getAddTo())) {
            headers.add(((ApiKeyAuth) datasourceConfiguration.getAuthentication()).getLabel());
        }

        // OAuth2 authentication with token sent via header.
        if (OAUTH2.equals(datasourceConfiguration.getAuthentication().getAuthenticationType()) &&
                ((OAuth2) datasourceConfiguration.getAuthentication()).getIsTokenHeader()) {
            headers.add(AUTHORIZATION_HEADER);
        }

        return headers;
    }

    public static Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> getAllDuplicateParams(ActionConfiguration actionConfiguration,
                                                                               DatasourceConfiguration datasourceConfiguration) {
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateMap = new HashMap<>();

        Set duplicatesInActionConfigOnly = findDuplicates(getActionParams(actionConfiguration));
        duplicateMap.put(ACTION_CONFIG_ONLY, duplicatesInActionConfigOnly);

        Set duplicatesInDsConfigOnly = findDuplicates(getDatasourceQueryParams(datasourceConfiguration));
        duplicateMap.put(DATASOURCE_CONFIG_ONLY, duplicatesInDsConfigOnly);

        Set duplicatesAcrossActionAndDsConfig = findDuplicates(getAllParams(actionConfiguration,
                datasourceConfiguration));
        duplicatesAcrossActionAndDsConfig.removeAll(duplicatesInActionConfigOnly);
        duplicatesAcrossActionAndDsConfig.removeAll(duplicatesInDsConfigOnly);
        duplicateMap.put(DATASOURCE_AND_ACTION_CONFIG, duplicatesAcrossActionAndDsConfig);

        return duplicateMap;
    }

    private static List getKeyList(List<Property> propertyList) {
        return propertyList.stream()
                .map(item -> item.getKey())
                .filter(key -> StringUtils.isNotEmpty(key))
                .collect(Collectors.toList());
    }

    private static List getAllParams(ActionConfiguration actionConfiguration,
                                     DatasourceConfiguration datasourceConfiguration) {
        List allParams = new ArrayList<String>();

        // Get all params defined in API query editor page.
        allParams.addAll(getActionParams(actionConfiguration));

        // Get all params defined in datasource editor page in the headers field.
        allParams.addAll(getDatasourceQueryParams(datasourceConfiguration));

        return allParams;
    }

    private static List getActionParams(ActionConfiguration actionConfiguration) {
        List<String> params = new ArrayList<>();

        if (actionConfiguration != null && !CollectionUtils.isEmpty(actionConfiguration.getQueryParameters())) {
            params.addAll(getKeyList(actionConfiguration.getQueryParameters()));
        }

        return params;
    }

    private static List getDatasourceQueryParams(DatasourceConfiguration datasourceConfiguration) {
        List<String> params = new ArrayList<>();

        if (datasourceConfiguration != null &&
                !CollectionUtils.isEmpty(datasourceConfiguration.getQueryParameters())) {
            params.addAll(getKeyList(datasourceConfiguration.getQueryParameters()));
        }

        // Get all params defined implicitly via authentication config for API.
        params.addAll(getAuthenticationParams(datasourceConfiguration));

        return params;
    }

    private static Set getAuthenticationParams(DatasourceConfiguration datasourceConfiguration) {

        if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
            return new HashSet<>();
        }

        Set<String> params = new HashSet<>();

        // Api key based auth where key is supplied via query param
        if (API_KEY.equals(datasourceConfiguration.getAuthentication().getAuthenticationType()) &&
                QUERY_PARAMS.equals(((ApiKeyAuth) datasourceConfiguration.getAuthentication()).getAddTo())) {
            params.add(((ApiKeyAuth) datasourceConfiguration.getAuthentication()).getLabel());
        }

        // OAuth2 authentication with token sent via query params.
        if (OAUTH2.equals(datasourceConfiguration.getAuthentication().getAuthenticationType()) &&
                !((OAuth2) datasourceConfiguration.getAuthentication()).getIsTokenHeader()) {
            params.add(ACCESS_TOKEN);
        }

        return params;
    }
}
