package com.external.plugins.pluginActions.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getTrimmedStringDataValueSafelyFromFormData;
import static com.external.plugins.constants.FieldNames.TRIGGER_DATA;
import static com.external.plugins.constants.FieldNames.WORKFLOW_ID;
import static com.external.plugins.constants.Urls.TRIGGER_WORKFLOW_URL;

public class TriggerWorkflowCommand extends BaseWorkflowCommand {

    public TriggerWorkflowCommand(ActionConfiguration actionConfiguration, ObjectMapper objectMapper) {
        super(actionConfiguration, objectMapper);
    }

    @Override
    protected HttpMethod getHttpMethod() {
        return HttpMethod.POST;
    }

    @Override
    public URI getExecutionUri() {
        Map<String, Object> formData = actionConfiguration.getFormData();
        String workflowId = getTrimmedStringDataValueSafelyFromFormData(formData, WORKFLOW_ID);
        if (StringUtils.isEmpty(workflowId)) {
            throw new AppsmithPluginException(WorkflowPluginError.WORKFLOW_UNDEFINED);
        }
        return UriComponentsBuilder.fromUriString(getTriggerWorkflowUrlString(workflowId))
                .build()
                .toUri();
    }

    @Override
    protected String getRequestBody() {
        Map<String, Object> formData = actionConfiguration.getFormData();
        String triggerData = getTrimmedStringDataValueSafelyFromFormData(formData, TRIGGER_DATA);
        if (!StringUtils.isEmpty(triggerData)) {
            try {
                objectMapper.readTree(triggerData);
            } catch (Exception exception) {
                throw new AppsmithPluginException(WorkflowPluginError.TRIGGER_DATA_INVALID_JSON);
            }
        }

        return triggerData;
    }

    private String getTriggerWorkflowUrlString(String workflowId) {
        return TRIGGER_WORKFLOW_URL + workflowId;
    }
}
