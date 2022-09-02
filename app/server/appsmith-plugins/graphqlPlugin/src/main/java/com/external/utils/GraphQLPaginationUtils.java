package com.external.utils;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import org.json.JSONObject;
import org.json.JSONException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.parseStringIntoJSONObject;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInPropertyList;
import static com.external.utils.GraphQLBodyUtils.PAGINATION_DATA_INDEX;
import static com.external.utils.GraphQLConstants.LIMIT_VAL;
import static com.external.utils.GraphQLConstants.LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NEXT_CURSOR_VAL;
import static com.external.utils.GraphQLConstants.NEXT_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NEXT_LIMIT_VAL;
import static com.external.utils.GraphQLConstants.NEXT_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.OFFSET_VAL;
import static com.external.utils.GraphQLConstants.OFFSET_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV_CURSOR_VAL;
import static com.external.utils.GraphQLConstants.PREV_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV_LIMIT_VAL;
import static com.external.utils.GraphQLConstants.PREV_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLBodyUtils.QUERY_VARIABLES_INDEX;
import static org.apache.commons.lang3.ObjectUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isBlank;

public class GraphQLPaginationUtils {

    private static String NULL_STRING = "null";

    public static Map getPaginationData(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        if (properties.size() < PAGINATION_DATA_INDEX + 1) {
            return null;
        }

        Map<String, Object> paginationData = null;
        if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
            paginationData =
                    getValueSafelyFromFormData((Map) properties.get(PAGINATION_DATA_INDEX).getValue(),
                    "limitBased", Map.class, null);
        }
        else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
            paginationData =
                    getValueSafelyFromFormData((Map) properties.get(PAGINATION_DATA_INDEX).getValue(),
                    "cursorBased", Map.class, null);
        }

        if (isEmpty(paginationData)) {
            return paginationData;
        }

        HashMap<String, String> transformedPaginationData = new HashMap<String, String>();
        if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
            String limitVarName = getValueSafelyFromFormData(paginationData, "limit.name", String.class, "");
            String limitValString = getValueSafelyFromFormData(paginationData, "limit.value", String.class, "");
            String offsetVarName = getValueSafelyFromFormData(paginationData, "offset.name", String.class, "");
            String offsetValString = getValueSafelyFromFormData(paginationData, "offset.value", String.class, "");
            offsetValString = isBlank(offsetValString) ? "0" : offsetValString;

            transformedPaginationData.put(LIMIT_VARIABLE_NAME, limitVarName);
            transformedPaginationData.put(LIMIT_VAL, limitValString);
            transformedPaginationData.put(OFFSET_VARIABLE_NAME, offsetVarName);
            transformedPaginationData.put(OFFSET_VAL, offsetValString);
        }
        else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
            String prevLimitVarName = getValueSafelyFromFormData(paginationData, "previous.limit.name", String.class,
                    "");
            String prevLimitValString = getValueSafelyFromFormData(paginationData, "previous.limit.value", String.class,
                    "");
            String prevCursorVarName = getValueSafelyFromFormData(paginationData, "previous.cursor.name", String.class,
                    "");
            String prevCursorValString = getValueSafelyFromFormData(paginationData, "previous.cursor.value",
                    String.class,
                    "");

            String nextLimitVarName = getValueSafelyFromFormData(paginationData, "next.limit.name", String.class, "");
            String nextLimitValString = getValueSafelyFromFormData(paginationData, "next.limit.value", String.class,
                    "");
            String nextCursorVarName = getValueSafelyFromFormData(paginationData, "next.cursor.name", String.class, "");
            String nextCursorValString = getValueSafelyFromFormData(paginationData, "next.cursor.value", String.class,
                    "");

            transformedPaginationData.put(PREV_LIMIT_VARIABLE_NAME, prevLimitVarName);
            transformedPaginationData.put(PREV_LIMIT_VAL, prevLimitValString);
            transformedPaginationData.put(PREV_CURSOR_VARIABLE_NAME, prevCursorVarName);
            transformedPaginationData.put(PREV_CURSOR_VAL, prevCursorValString);
            transformedPaginationData.put(NEXT_LIMIT_VARIABLE_NAME, nextLimitVarName);
            transformedPaginationData.put(NEXT_LIMIT_VAL, nextLimitValString);
            transformedPaginationData.put(NEXT_CURSOR_VARIABLE_NAME, nextCursorVarName);
            transformedPaginationData.put(NEXT_CURSOR_VAL, nextCursorValString);
        }

        return transformedPaginationData;
    }

    public static void updateVariablesWithPaginationValues(ActionConfiguration actionConfiguration,
                                                           ExecuteActionDTO executeActionDTO) throws AppsmithPluginException {
        final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        JSONObject queryVariablesJson = new JSONObject();
        try {
            queryVariablesJson = parseStringIntoJSONObject(variables);
        } catch (JSONException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "GraphQL query " +
                    "variables are not in proper JSON format: " + e.getMessage());
        }

        Map<String, String> paginationDataMap = getPaginationData(actionConfiguration);
        if (isEmpty(paginationDataMap)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Appsmith " +
                    "server could not find any GraphQL pagination data even though pagination is toggled on. Please " +
                    "provide pagination data by editing relevant fields in the pagination tab.");
        }

        if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
            String limitVarName = paginationDataMap.get(LIMIT_VARIABLE_NAME);
            String limitValueString = paginationDataMap.get(LIMIT_VAL);
            int limitValue = 0;
            try {
                limitValue = Integer.parseInt(limitValueString);
            } catch (Exception e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Please provide " +
                        "a valid integer value for the limit variable in the pagination tab. Current value: " + limitValueString);
            }

            String offsetVarName = paginationDataMap.get(OFFSET_VARIABLE_NAME);
            String offsetValueString = paginationDataMap.get(OFFSET_VAL);
            int offsetValue = 0;
            try {
                offsetValue = Integer.parseInt(offsetValueString);
            } catch (Exception e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Please provide " +
                        "a valid integer value for the offset variable in the pagination tab. Current value: " + offsetValueString);
            }

            queryVariablesJson.put(limitVarName, limitValue);
            queryVariablesJson.put(offsetVarName, offsetValue);
        }
        else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
            if (PaginationField.PREV.equals(executeActionDTO.getPaginationField())) {
                String prevLimitVarName = paginationDataMap.get(PREV_LIMIT_VARIABLE_NAME);
                String prevLimitValueString = paginationDataMap.get(PREV_LIMIT_VAL);
                int prevLimitValue = 0;
                try {
                    prevLimitValue = Integer.parseInt(prevLimitValueString);
                } catch (Exception e) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Please provide " +
                            "a valid integer value for the previous page limit variable in the pagination tab. " +
                            "Current value: " + prevLimitValueString);
                }
                queryVariablesJson.put(prevLimitVarName, prevLimitValue);

                String prevCursorVarName = paginationDataMap.get(PREV_CURSOR_VARIABLE_NAME);
                String prevCursorValue = paginationDataMap.get(PREV_CURSOR_VAL);
                if (isBlank(prevCursorValue)) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a non empty value for the previous page cursor variable in the pagination" +
                                    " tab."
                    );
                }

                /**
                 * This check ensures that during the very first run when the query does not have any cursor data the
                 * cursor related variable does not get added. In this case since the cursor data is not available
                 * the dynamic binding value returned by the client is "null" string. Some GraphQL severs are able to
                 * handle the "null" string as cursor value but some are not e.g. GitHub's GraphQL endpoints are not
                 * able to handle "null" as value. Hence, it is better to skip passing the variable and allow the
                 * GraphQL servers to run the query without cursor value. The GraphQL servers against which we are
                 * testing seem to handle the case well where the value is skipped.
                 */
                if (!NULL_STRING.equals(prevCursorValue)) {
                    queryVariablesJson.put(prevCursorVarName, prevCursorValue);
                }
            }
            else {
                String nextLimitVarName = paginationDataMap.get(NEXT_LIMIT_VARIABLE_NAME);
                String nextLimitValueString = paginationDataMap.get(NEXT_LIMIT_VAL);
                int nextLimitValue = 0;
                try {
                    nextLimitValue = Integer.parseInt(nextLimitValueString);
                } catch (Exception e) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Please provide " +
                            "a valid integer value for the next page limit variable in the pagination tab. " +
                            "Current value: " + nextLimitValueString);
                }
                queryVariablesJson.put(nextLimitVarName, nextLimitValue);

                String nextCursorVarName = paginationDataMap.get(NEXT_CURSOR_VARIABLE_NAME);
                String nextCursorValue = paginationDataMap.get(NEXT_CURSOR_VAL);
                if (isBlank(nextCursorValue)) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Please provide a non empty value for the next page cursor variable in the pagination tab."
                    );
                }

                /**
                 * This check ensures that during the very first run when the query does not have any cursor data the
                 * cursor related variable does not get added. In this case since the cursor data is not available
                 * the dynamic binding value returned by the client is "null" string. Some GraphQL severs are able to
                 * handle the "null" string as cursor value but some are not e.g. GitHub's GraphQL endpoints are not
                 * able to handle "null" as value. Hence, it is better to skip passing the variable and allow the
                 * GraphQL servers to run the query without cursor value. The GraphQL servers against which we are
                 * testing seem to handle the case well where the value is skipped.
                 */
                if (!NULL_STRING.equals(nextCursorValue)) {
                    queryVariablesJson.put(nextCursorVarName, nextCursorValue);
                }
            }
        }
        else {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: unrecognized pagination type: " + actionConfiguration.getPaginationType() +
                            ". Please reach out to our customer support to resolve this."
            );
        }

        setValueSafelyInPropertyList(properties, QUERY_VARIABLES_INDEX, queryVariablesJson.toString());
    }
}
