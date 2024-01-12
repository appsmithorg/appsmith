package com.external.plugins.pluginActions.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Map;

import static com.external.plugins.constants.FieldNames.COUNT;
import static com.external.plugins.constants.FieldNames.LIMIT;
import static com.external.plugins.constants.FieldNames.PAGINATED_CONTENT;
import static com.external.plugins.constants.FieldNames.REQUEST_NAME;
import static com.external.plugins.constants.FieldNames.REQUEST_STATUS;
import static com.external.plugins.constants.FieldNames.SKIP;
import static com.external.plugins.constants.FieldNames.START_INDEX;
import static com.external.plugins.constants.FieldNames.STATUS;
import static com.external.plugins.constants.FieldNames.WORKFLOW_ID;
import static com.external.plugins.constants.Urls.APPROVAL_REQUEST_URL;
import static com.external.plugins.utils.RequestUtility.extractStringFromFormData;

public class GetApprovalRequestWorkflowCommand extends BaseWorkflowCommand {
    public GetApprovalRequestWorkflowCommand(ActionConfiguration actionConfiguration, ObjectMapper objectMapper) {
        super(actionConfiguration, objectMapper);
    }

    @Override
    protected HttpMethod getHttpMethod() {
        return HttpMethod.GET;
    }

    private UriComponentsBuilder getExecutionUriBuilder() {
        return UriComponentsBuilder.fromUriString(APPROVAL_REQUEST_URL);
    }

    private MultiValueMap<String, String> getQueryParams() {
        MultiValueMap<String, String> queryParams = new LinkedMultiValueMap<>();
        Map<String, Object> formData = actionConfiguration.getFormData();
        String workflowId = extractStringFromFormData(formData, WORKFLOW_ID);
        if (StringUtils.isEmpty(workflowId)) {
            throw new AppsmithPluginException(WorkflowPluginError.WORKFLOW_UNDEFINED);
        }
        queryParams.add(WORKFLOW_ID, workflowId);

        String requestStatus = extractStringFromFormData(formData, REQUEST_STATUS);
        if (StringUtils.isNotEmpty(requestStatus)) {
            queryParams.add(STATUS, requestStatus);
        }

        String requestName = extractStringFromFormData(formData, REQUEST_NAME);
        if (StringUtils.isNotEmpty(requestName)) {
            queryParams.add(REQUEST_NAME, requestName);
        }

        String limit = extractStringFromFormData(formData, LIMIT);
        if (StringUtils.isNotEmpty(limit)) {
            queryParams.add(COUNT, limit);
        }

        String skip = extractStringFromFormData(formData, SKIP);
        if (StringUtils.isNotEmpty(skip)) {
            queryParams.add(START_INDEX, skip);
        }

        return queryParams;
    }

    @Override
    public URI getExecutionUri() {
        return getExecutionUriBuilder().queryParams(getQueryParams()).build().toUri();
    }

    @Override
    protected String getRequestBody() {
        return null;
    }

    @Override
    public Mono<ResponseEntity<String>> getResponse() {
        Mono<ResponseEntity<String>> responseEntityMono = super.getResponse();
        return responseEntityMono.flatMap(paginatedResponseEntity -> {
            try {
                JsonNode paginatedResponseBody = objectMapper.readTree(paginatedResponseEntity.getBody());
                JsonNode content = paginatedResponseBody.get(PAGINATED_CONTENT);
                return Mono.just(new ResponseEntity<>(content.toString(), paginatedResponseEntity.getStatusCode()));
            } catch (JsonProcessingException e) {
                return Mono.error(
                        new AppsmithPluginException(WorkflowPluginError.QUERY_EXECUTION_FAILED, e.getMessage()));
            }
        });
    }
}
