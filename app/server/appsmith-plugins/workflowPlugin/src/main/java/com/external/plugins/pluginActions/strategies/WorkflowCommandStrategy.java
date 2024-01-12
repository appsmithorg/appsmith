package com.external.plugins.pluginActions.strategies;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.enums.WorkflowPluginCommandRequestType;
import com.external.plugins.pluginActions.commands.GetApprovalRequestWorkflowCommand;
import com.external.plugins.pluginActions.commands.ResolveApprovalRequestWorkflowCommand;
import com.external.plugins.pluginActions.commands.TriggerWorkflowCommand;
import com.external.plugins.pluginActions.commands.WorkflowCommand;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import org.springframework.util.CollectionUtils;

import java.util.Map;

import static com.external.plugins.constants.FieldNames.REQUEST_TYPE;
import static com.external.plugins.enums.WorkflowPluginCommandRequestType.getRequestType;
import static com.external.plugins.utils.RequestUtility.extractStringFromFormData;

public class WorkflowCommandStrategy {

    private static final Gson gson = new Gson();

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static WorkflowCommand getWorkflowCommand(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Command request type can't be empty.");
        }

        WorkflowPluginCommandRequestType requestType =
                getRequestType(extractStringFromFormData(formData, REQUEST_TYPE));
        return switch (requestType) {
            case GET_APPROVAL_REQUESTS -> new GetApprovalRequestWorkflowCommand(actionConfiguration, objectMapper);
            case TRIGGER_WORKFLOW -> new TriggerWorkflowCommand(actionConfiguration, objectMapper);
            case RESOLVE_APPROVAL_REQUESTS -> new ResolveApprovalRequestWorkflowCommand(
                    actionConfiguration, objectMapper, gson);
        };
    }
}
