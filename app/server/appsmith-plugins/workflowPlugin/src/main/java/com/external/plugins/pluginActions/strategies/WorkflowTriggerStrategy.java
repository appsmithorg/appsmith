package com.external.plugins.pluginActions.strategies;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.enums.WorkflowPluginTriggerRequestType;
import com.external.plugins.pluginActions.trigger.WorkflowSelectorWorkflowTrigger;
import com.external.plugins.pluginActions.trigger.WorkflowTrigger;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import org.apache.commons.lang3.StringUtils;

import static com.external.plugins.enums.WorkflowPluginTriggerRequestType.getTriggerRequestType;

public class WorkflowTriggerStrategy {
    private static final Gson gson = new Gson();

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static WorkflowTrigger getWorkflowTrigger(TriggerRequestDTO triggerRequestDTO) {
        if (StringUtils.isEmpty(triggerRequestDTO.getRequestType())) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Trigger request type can't be empty.");
        }
        WorkflowPluginTriggerRequestType requestType = getTriggerRequestType(triggerRequestDTO.getRequestType());
        return switch (requestType) {
            case WORKFLOW_SELECTOR -> new WorkflowSelectorWorkflowTrigger(triggerRequestDTO, objectMapper);
        };
    }
}
