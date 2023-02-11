package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.helpers.HintMessageUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import lombok.NoArgsConstructor;
import org.json.JSONObject;
import org.json.JSONException;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.parseStringIntoJSONObject;
import static com.external.utils.GraphQLBodyUtils.QUERY_VARIABLES_INDEX;
import static com.external.utils.GraphQLConstants.HINT_MESSAGE_FOR_DUPLICATE_VARIABLE_DEFINITION;
import static com.external.utils.GraphQLConstants.LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NEXT_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.NEXT_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.OFFSET_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV_CURSOR_VARIABLE_NAME;
import static com.external.utils.GraphQLConstants.PREV_LIMIT_VARIABLE_NAME;
import static com.external.utils.GraphQLPaginationUtils.getPaginationData;
import static org.apache.commons.lang3.ObjectUtils.isEmpty;

@NoArgsConstructor
public class GraphQLHintMessageUtils extends HintMessageUtils {

    /**
     * This method checks if the user has defined a query variable in both the places - pagination tab and the query
     * variables editor section. If so, then a warning message is returned informing user of the same.
     */
    public static Set<String> getHintMessagesForDuplicatesInQueryVariables(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        if (actionConfiguration == null) {
            return new HashSet<>();
        }

        Set<String> hintMessages = new HashSet<String>();
        List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
        String variables = getValueSafelyFromPropertyList(properties, QUERY_VARIABLES_INDEX, String.class);
        JSONObject queryVariablesJson = new JSONObject();
        try {
            queryVariablesJson = parseStringIntoJSONObject(variables);
        } catch (JSONException | ClassCastException e) {
            /* Not returning an exception here since the user is still editing the query variables and hence it is
-            expected that the query variables would not be parseable till the final edit. */
        }

        Map<String, Object> paginationDataMap =  getPaginationData(actionConfiguration);
        if (!PaginationType.NONE.equals(actionConfiguration.getPaginationType()) && !isEmpty(paginationDataMap)) {
            List<String> duplicateVariables = new ArrayList<String>();
            if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
                String limitVarName = (String) paginationDataMap.get(LIMIT_VARIABLE_NAME);
                String offsetVarName = (String) paginationDataMap.get(OFFSET_VARIABLE_NAME);

                if (queryVariablesJson.has(limitVarName)) {
                    duplicateVariables.add(limitVarName);
                }

                if (queryVariablesJson.has(offsetVarName)) {
                    duplicateVariables.add(offsetVarName);
                }
            }
            else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
                String prevLimitVarName = (String) paginationDataMap.get(PREV_LIMIT_VARIABLE_NAME);
                String prevCursorVarName = (String) paginationDataMap.get(PREV_CURSOR_VARIABLE_NAME);
                String nextLimitVarName = (String) paginationDataMap.get(NEXT_LIMIT_VARIABLE_NAME);
                String nextCursorVarName = (String) paginationDataMap.get(NEXT_CURSOR_VARIABLE_NAME);

                if (queryVariablesJson.has(prevLimitVarName)) {
                    duplicateVariables.add(prevLimitVarName);
                }

                if (queryVariablesJson.has(prevCursorVarName)) {
                    duplicateVariables.add(prevCursorVarName);
                }

                if (queryVariablesJson.has(nextLimitVarName)) {
                    duplicateVariables.add(nextLimitVarName);
                }

                if (queryVariablesJson.has(nextCursorVarName)) {
                    duplicateVariables.add(nextCursorVarName);
                }
            }
            else {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server encountered an unexpected error: unrecognized pagination type: " + actionConfiguration.getPaginationType() +
                                ". Please reach out to our customer support to resolve this."
                );
            }

            if (!isEmpty(duplicateVariables)) {
                String message = MessageFormat.format(HINT_MESSAGE_FOR_DUPLICATE_VARIABLE_DEFINITION,
                        duplicateVariables.toString());
                hintMessages.add(message);
            }
        }

        return hintMessages;
    }

    @Override
    public Set<String> getActionHintMessages(ActionConfiguration actionConfiguration,
                                             DatasourceConfiguration datasourceConfiguration) {

        Set<String> actionHintMessages = super.getActionHintMessages(actionConfiguration, datasourceConfiguration);

        actionHintMessages.addAll(getHintMessagesForDuplicatesInQueryVariables(actionConfiguration));

        return actionHintMessages;
    }
}
