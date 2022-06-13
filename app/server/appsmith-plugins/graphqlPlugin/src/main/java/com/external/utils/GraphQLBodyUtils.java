package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import graphql.parser.InvalidSyntaxException;
import graphql.parser.Parser;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.ParseException;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.parseStringIntoJSONObject;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.apache.commons.lang3.StringUtils.isEmpty;

public class GraphQLBodyUtils {
    public static final int QUERY_VARIABLES_INDEX = 1;
    public static final String QUERY_KEY = "query";
    public static final String VARIABLES_KEY = "variables";

    public static String convertToGraphQLPOSTBodyFormat(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        JSONObject query = new JSONObject();
        query.put(QUERY_KEY, actionConfiguration.getBody());

        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        if (!isBlank(variables)) {
            try {
                JSONObject json = parseStringIntoJSONObject(variables);
                query.put(VARIABLES_KEY, json);
            } catch (ParseException | ClassCastException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "GraphQL query " +
                        "variables are not in proper JSON format: " + e.getMessage());
            }
        }

        return query.toString();
    }

    public static void validateBodyAndVariablesSyntax(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        Parser graphqlParser = new Parser();
        try {
            graphqlParser.parseDocument(actionConfiguration.getBody());
        } catch (InvalidSyntaxException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    "Invalid GraphQL body: " + e.getMessage());
        }

        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        if (!isEmpty(variables)) {
            try {
                parseStringIntoJSONObject(variables);
            } catch (ParseException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "GraphQL query variables are not in proper JSON format: " + e.getMessage()
                );
            }
        }
    }

    public static List<Property> getGraphQLQueryParamsForBodyAndVariables(ActionConfiguration actionConfiguration) {
        List<Property> queryParams = new ArrayList<>();
        queryParams.add(new Property(QUERY_KEY, actionConfiguration.getBody()));

        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        if (!isBlank(variables)) {
            queryParams.add(new Property(VARIABLES_KEY, variables));
        }

        return queryParams;
    }
}
