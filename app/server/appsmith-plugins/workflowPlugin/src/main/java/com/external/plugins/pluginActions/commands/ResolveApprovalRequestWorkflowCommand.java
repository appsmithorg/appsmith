package com.external.plugins.pluginActions.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.dtos.ResolveApprovalRequestWorkflowCommandDTO;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

import static com.external.plugins.constants.FieldNames.REQUEST_ID;
import static com.external.plugins.constants.FieldNames.RESOLUTION;
import static com.external.plugins.constants.FieldNames.RESOLUTION_METADATA;
import static com.external.plugins.constants.FieldNames.RESOLUTION_REASON;
import static com.external.plugins.constants.FieldNames.WORKFLOW_ID;
import static com.external.plugins.constants.Urls.RESOLVE_APPROVAL_REQUEST_URL;
import static com.external.plugins.utils.RequestUtility.extractStringFromFormData;

public class ResolveApprovalRequestWorkflowCommand extends BaseWorkflowCommand {

    private final Gson gson;

    public ResolveApprovalRequestWorkflowCommand(
            ActionConfiguration actionConfiguration, ObjectMapper objectMapper, Gson gson) {
        super(actionConfiguration, objectMapper);
        this.gson = gson;
    }

    @Override
    protected HttpMethod getHttpMethod() {
        return HttpMethod.PUT;
    }

    @Override
    public URI getExecutionUri() {
        return UriComponentsBuilder.fromUriString(getResolveApprovalRequestUrlString())
                .build()
                .toUri();
    }

    @Override
    protected String getRequestBody() {
        Map<String, Object> formData = actionConfiguration.getFormData();
        ResolveApprovalRequestWorkflowCommandDTO resolveApprovalRequestWorkflowCommandDTO =
                new ResolveApprovalRequestWorkflowCommandDTO();
        String workflowId = extractStringFromFormData(formData, WORKFLOW_ID);
        if (StringUtils.isEmpty(workflowId)) {
            throw new AppsmithPluginException(WorkflowPluginError.WORKFLOW_UNDEFINED);
        }
        resolveApprovalRequestWorkflowCommandDTO.setWorkflowId(workflowId);

        String requestId = extractStringFromFormData(formData, REQUEST_ID);
        if (StringUtils.isEmpty(requestId)) {
            throw new AppsmithPluginException(WorkflowPluginError.APPROVAL_REQUEST_ID_MISSING);
        }
        resolveApprovalRequestWorkflowCommandDTO.setRequestId(requestId);

        String resolution = extractStringFromFormData(formData, RESOLUTION);
        if (StringUtils.isEmpty(resolution)) {
            throw new AppsmithPluginException(WorkflowPluginError.APPROVAL_REQUEST_RESOLUTION_MISSING);
        }
        resolveApprovalRequestWorkflowCommandDTO.setResolution(resolution);

        String resolutionReason = extractStringFromFormData(formData, RESOLUTION_REASON);
        if (StringUtils.isNotEmpty(resolutionReason)) {
            resolveApprovalRequestWorkflowCommandDTO.setResolutionReason(resolutionReason);
        }

        String resolutionMetadata = extractStringFromFormData(formData, RESOLUTION_METADATA);
        if (StringUtils.isNotEmpty(resolutionMetadata)) {
            try {
                JsonNode jsonNode = objectMapper.readTree(resolutionMetadata);
                resolveApprovalRequestWorkflowCommandDTO.setResolutionMetadata(jsonNode);
            } catch (JsonProcessingException e) {
                throw new AppsmithPluginException(WorkflowPluginError.RESOLUTION_METADATA_INVALID_JSON);
            }
        }
        return gson.toJson(resolveApprovalRequestWorkflowCommandDTO);
    }

    private String getResolveApprovalRequestUrlString() {
        return RESOLVE_APPROVAL_REQUEST_URL;
    }
}
