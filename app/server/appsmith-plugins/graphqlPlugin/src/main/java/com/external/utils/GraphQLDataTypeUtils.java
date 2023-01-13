package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import graphql.parser.InvalidSyntaxException;
import graphql.parser.Parser;
import reactor.core.Exceptions;

import java.util.AbstractMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;

import static com.appsmith.external.helpers.DataTypeStringUtils.placeholderPattern;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.APPSMITH_SUBSTITUTION_PLACEHOLDER;

public class GraphQLDataTypeUtils {
    public static final String GRAPHQL_BODY_ENDS_WITH_PARAM_REGEX = "[\\w\\W]+:$";

    public static final ObjectMapper objectMapper = new ObjectMapper();

    public static String smartlyReplaceGraphQLQueryBodyPlaceholderWithValue(String queryBody, String replacement,
                                                                            List<Map.Entry<String, String>> insertedParams) {
        final GraphQLBodyDataType dataType = stringToKnownGraphQLDataTypeConverter(queryBody, replacement);
        Map.Entry<String, String> parameter = new AbstractMap.SimpleEntry<>(replacement, dataType.toString());
        insertedParams.add(parameter);

        String updatedReplacement;
        switch (dataType) {
            case GRAPHQL_BODY_STRING:
                try {
                    String valueAsString = objectMapper.writeValueAsString(replacement);
                    updatedReplacement = Matcher.quoteReplacement(valueAsString);
                } catch (JsonProcessingException e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    replacement,
                                    e.getMessage()
                            )
                    );
                }
                break;
            case GRAPHQL_BODY_FULL:
            case GRAPHQL_BODY_INTEGER:
            case GRAPHQL_BODY_BOOLEAN:
            default:
                updatedReplacement = Matcher.quoteReplacement(replacement);
                break;
        }

        queryBody = placeholderPattern.matcher(queryBody).replaceFirst(updatedReplacement);
        return queryBody;
    }

    public static GraphQLBodyDataType stringToKnownGraphQLDataTypeConverter(String queryBody, String replacement) {
        if (replacement == null) {
            return GraphQLBodyDataType.NULL;
        }

        Parser graphqlParser = new Parser();
        try {
            graphqlParser.parseDocument(replacement);
            return GraphQLBodyDataType.GRAPHQL_BODY_FULL;
        } catch (InvalidSyntaxException e) {
           // do nothing
        }

        try {
            Integer.parseInt(replacement);
            return GraphQLBodyDataType.GRAPHQL_BODY_INTEGER;
        } catch (NumberFormatException e) {
            // do nothing
        }

        try {
            Float.parseFloat(replacement);
            return GraphQLBodyDataType.GRAPHQL_BODY_FLOAT;
        } catch (NumberFormatException e2) {
            // Not float
        }

        // Creating a copy of the input in lower case form to do simple string equality to check for boolean/null types.
        String copyInput = String.valueOf(replacement).toLowerCase().trim();
        if (copyInput.equals("true") || copyInput.equals("false")) {
            return GraphQLBodyDataType.GRAPHQL_BODY_BOOLEAN;
        }

        String prefix = queryBody.split(APPSMITH_SUBSTITUTION_PLACEHOLDER)[0].trim();
        if (prefix.matches(GRAPHQL_BODY_ENDS_WITH_PARAM_REGEX)) {
            return GraphQLBodyDataType.GRAPHQL_BODY_STRING;
        }

        return GraphQLBodyDataType.GRAPHQL_BODY_PARTIAL;
    }
}
