package com.external.utils;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.ParseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.parseStringIntoJSONObject;
import static com.external.utils.GraphQLConstants.CURSOR;
import static com.external.utils.GraphQLConstants.LIMIT;
import static com.external.utils.GraphQLConstants.LIMIT_VAL;
import static com.external.utils.GraphQLConstants.LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NAME;
import static com.external.utils.GraphQLConstants.NEXT;
import static com.external.utils.GraphQLConstants.NEXT_CURSOR_VAL;
import static com.external.utils.GraphQLConstants.NEXT_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NEXT_LIMIT_VAL;
import static com.external.utils.GraphQLConstants.NEXT_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.OFFSET;
import static com.external.utils.GraphQLConstants.OFFSET_VAL;
import static com.external.utils.GraphQLConstants.OFFSET_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV;
import static com.external.utils.GraphQLConstants.PREV_CURSOR_VAL;
import static com.external.utils.GraphQLConstants.PREV_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV_LIMIT_VAL;
import static com.external.utils.GraphQLConstants.PREV_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.VALUE;
import static com.external.utils.GraphQLHintMessageUtils.getHintMessagesForDuplicatesInQueryVariables;
import static com.external.utils.GraphQLBodyUtils.QUERY_VARIABLES_INDEX;
import static org.apache.commons.lang3.StringUtils.isBlank;

public class GraphQLPaginationUtils {
    public static Map getPaginationData(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String paginationData = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        JSONObject paginationDataJson;
        try {
            paginationDataJson = parseStringIntoJSONObject(paginationData);
        } catch (ParseException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: failed to parse pagination data into JSON. " +
                            "Please reach out to our customer support to resolve this."
            );
        }

        HashMap<String, Object> paginationDataMap = new HashMap<String, Object>();
        if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
            String limitVarName = ((JSONObject) paginationDataJson.get(LIMIT)).getAsString(NAME);
            int limitValue;
            try {
                limitValue = ((JSONObject) paginationDataJson.get(LIMIT)).getAsNumber(VALUE).intValue();
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Please provide a valid number for variable '" + limitVarName + "' in the pagination " +
                                "tab."
                );
            }

            String offsetVarName = ((JSONObject) paginationDataJson.get(OFFSET)).getAsString(NAME);
            int offsetValue;
            try {
                offsetValue = ((JSONObject) paginationDataJson.get(OFFSET)).getAsNumber(VALUE).intValue();
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Please provide a valid number for variable '" + offsetVarName + "' in the pagination " +
                                "tab."
                );
            }

            paginationDataMap.put(LIMIT_VARIABLE_NAME, limitVarName);
            paginationDataMap.put(LIMIT_VAL, limitValue);
            paginationDataMap.put(OFFSET_VARIABLE_NAME, offsetVarName);
            paginationDataMap.put(OFFSET_VAL, offsetValue);
        }
        else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
            String prevLimitVarName =
                    (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(LIMIT)).getAsString(NAME));
            int prevLimitValue;
            try {
                prevLimitValue =
                        ((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(LIMIT)).getAsNumber(VALUE).intValue();
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Please provide a valid number for variable '" + prevLimitVarName + "' in the pagination " +
                                "tab."
                );
            }

            String prevCursorVarName =
                    (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(CURSOR)).getAsString(NAME));
            String prevCursorValue =
                    ((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(CURSOR)).getAsString(VALUE);


            String nextLimitVarName =
                    (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(LIMIT)).getAsString(NAME));
            int nextLimitValue;
            try {
                nextLimitValue =
                        ((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(LIMIT)).getAsNumber(VALUE).intValue();
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Please provide a valid number for variable '" + nextLimitVarName + "' in the pagination " +
                                "tab."
                );
            }

            String nextCursorVarName =
                    (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(CURSOR)).getAsString(NAME));
            String nextCursorValue =
                    ((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(CURSOR)).getAsString(VALUE);


            paginationDataMap.put(PREV_LIMIT_VARIABLE_NAME, prevLimitVarName);
            paginationDataMap.put(PREV_LIMIT_VAL, prevLimitValue);
            paginationDataMap.put(PREV_CURSOR_VARIABLE_NAME, prevCursorVarName);
            paginationDataMap.put(PREV_CURSOR_VAL, prevCursorValue);
            paginationDataMap.put(NEXT_LIMIT_VARIABLE_NAME, nextLimitVarName);
            paginationDataMap.put(NEXT_LIMIT_VAL, nextLimitValue);
            paginationDataMap.put(NEXT_CURSOR_VARIABLE_NAME, nextCursorVarName);
            paginationDataMap.put(NEXT_CURSOR_VAL, nextCursorValue);
        }

        return paginationDataMap;
    }

    public static void updateVariablesWithPaginationValues(ActionConfiguration actionConfiguration,
                                                           ExecuteActionDTO executeActionDTO,
                                                           Set<String> hintMessages) throws AppsmithPluginException {
        hintMessages.addAll(getHintMessagesForDuplicatesInQueryVariables(actionConfiguration));

        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String paginationData = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        JSONObject paginationDataJson;
        try {
            paginationDataJson = parseStringIntoJSONObject(paginationData);
        } catch (ParseException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: failed to parse pagination data into JSON. " +
                            "Please reach out to our customer support to resolve this."
            );
        }

        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        JSONObject queryVariablesJson = new JSONObject();
        try {
            queryVariablesJson = parseStringIntoJSONObject(variables);
        } catch (ParseException e) {
            // TODO: add comment
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "GraphQL query " +
                    "variables are not in proper JSON format: " + e.getMessage());
        }

        // TODO: refactor to remove dup code
        if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
            String limitVarName = ((JSONObject)paginationDataJson.get(LIMIT)).getAsString(NAME);
            int limitValue = ((JSONObject)paginationDataJson.get(LIMIT)).getAsNumber(VALUE).intValue();
            String offsetVarName = ((JSONObject)paginationDataJson.get(OFFSET)).getAsString(NAME);
            int offsetValue = ((JSONObject)paginationDataJson.get(OFFSET)).getAsNumber(VALUE).intValue();

            queryVariablesJson.put(limitVarName, limitValue);
            queryVariablesJson.put(offsetVarName, offsetValue);
        }
        else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
            if (PaginationField.PREV.equals(executeActionDTO.getPaginationField())) {
                String prevLimitVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(LIMIT)).getAsString(NAME));
                int prevLimitValue = 0;
                try {
                    prevLimitValue = (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(LIMIT)).getAsNumber(NAME)).intValue();
                } catch (NumberFormatException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a valid number for variable '" + prevLimitVarName + "' in the pagination " +
                                    "tab."
                    );
                }

                String prevCursorVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(CURSOR)).getAsString(NAME));
                String prevCursorValue =
                        ((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(CURSOR)).getAsString(NAME);
                if (isBlank(prevCursorValue)) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a non empty value for variable '" + prevCursorVarName + "' in the " +
                                    "pagination tab."
                    );
                }

                queryVariablesJson.put(prevLimitVarName, prevLimitValue);
                queryVariablesJson.put(prevCursorVarName, prevCursorValue);
            }
            else if (PaginationField.NEXT.equals(executeActionDTO.getPaginationField())) {
                String nextLimitVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(LIMIT)).getAsString(NAME));
                int nextLimitValue = 0;
                try {
                    nextLimitValue = (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(LIMIT)).getAsNumber(NAME)).intValue();
                } catch (NumberFormatException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a valid number for variable '" + nextLimitVarName + "' in the pagination" +
                                    " tab."
                    );
                }

                String nextCursorVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(CURSOR)).getAsString(NAME));
                String nextCursorValue =
                        ((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(CURSOR)).getAsString(NAME);
                if (isBlank(nextCursorValue)) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a non empty value for variable '" + nextCursorVarName + "' in the " +
                                    "pagination tab."
                    );
                }

                queryVariablesJson.put(nextLimitVarName, nextLimitValue);
                queryVariablesJson.put(nextCursorVarName, nextCursorValue);
            }
        }
        else {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: unrecognized pagination type: " + actionConfiguration.getPaginationType() +
                            ". Please reach out to our customer support to resolve this."
            );
        }
    }
}
