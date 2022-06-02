package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.helpers.HintMessageUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import lombok.NoArgsConstructor;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.ParseException;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromPropertyList;
import static com.appsmith.external.helpers.PluginUtils.parseStringIntoJSONObject;
import static com.external.utils.GraphQLBodyUtils.QUERY_VARIABLES_INDEX;
import static com.external.utils.GraphQLConstants.CURSOR;
import static com.external.utils.GraphQLConstants.HINT_MESSAGE_FOR_DUPLICATE_VARIABLE_DEFINITION;
import static com.external.utils.GraphQLConstants.LIMIT;
import static com.external.utils.GraphQLConstants.NAME;
import static com.external.utils.GraphQLConstants.NEXT;
import static com.external.utils.GraphQLConstants.OFFSET;
import static com.external.utils.GraphQLConstants.PREV;
import static org.apache.commons.lang3.ObjectUtils.isEmpty;

@NoArgsConstructor
public class GraphQLHintMessageUtils extends HintMessageUtils {

    // TODO: add comments
    public static Set<String> getHintMessagesForDuplicatesInQueryVariables(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        Set<String> hintMessages = new HashSet<String>();

        if (actionConfiguration.getPaginationType() != null) {
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
            /* Not returning an exception here since the user is still editing the query variables and hence it is
            expected that the query variables would not be parseable till the final edit. */
            }

            List<String> duplicateVariables = new ArrayList<String>();
            if (PaginationType.PAGE_NO.equals(actionConfiguration.getPaginationType())) {
                String limitVarName = ((JSONObject)paginationDataJson.get(LIMIT)).getAsString(NAME);
                String offsetVarName = ((JSONObject)paginationDataJson.get(OFFSET)).getAsString(NAME);

                if (queryVariablesJson.containsKey(limitVarName)) {
                    duplicateVariables.add(limitVarName);
                }

                if (queryVariablesJson.containsKey(offsetVarName)) {
                    duplicateVariables.add(offsetVarName);
                }
            }
            else if (PaginationType.CURSOR.equals(actionConfiguration.getPaginationType())) {
                // TODO: remove duplication
                String prevLimitVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(LIMIT)).getAsString(NAME));
                String prevCursorVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(PREV)).get(CURSOR)).getAsString(NAME));
                String nextLimitVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(LIMIT)).getAsString(NAME));
                String nextCursorVarName =
                        (((JSONObject)((JSONObject)paginationDataJson.get(NEXT)).get(CURSOR)).getAsString(NAME));

                if (queryVariablesJson.containsKey(prevLimitVarName)) {
                    duplicateVariables.add(prevLimitVarName);
                }

                if (queryVariablesJson.containsKey(prevCursorVarName)) {
                    duplicateVariables.add(prevCursorVarName);
                }

                if (queryVariablesJson.containsKey(nextLimitVarName)) {
                    duplicateVariables.add(nextLimitVarName);
                }

                if (queryVariablesJson.containsKey(nextCursorVarName)) {
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

        // TODO: add comments
        actionHintMessages.addAll(getHintMessagesForDuplicatesInQueryVariables(actionConfiguration));

        return actionHintMessages;
    }
}
