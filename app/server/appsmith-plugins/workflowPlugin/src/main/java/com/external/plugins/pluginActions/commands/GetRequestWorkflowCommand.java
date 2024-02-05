package com.external.plugins.pluginActions.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getTrimmedStringDataValueSafelyFromFormData;
import static com.external.plugins.constants.FieldNames.COUNT;
import static com.external.plugins.constants.FieldNames.LIMIT;
import static com.external.plugins.constants.FieldNames.PAGINATED_CONTENT;
import static com.external.plugins.constants.FieldNames.REQUEST_NAME;
import static com.external.plugins.constants.FieldNames.REQUEST_NAMES;
import static com.external.plugins.constants.FieldNames.REQUEST_STATUS;
import static com.external.plugins.constants.FieldNames.SKIP;
import static com.external.plugins.constants.FieldNames.START_INDEX;
import static com.external.plugins.constants.FieldNames.STATUS;
import static com.external.plugins.constants.FieldNames.WORKFLOW_ID;
import static com.external.plugins.constants.Urls.APPROVAL_REQUEST_URL;

public class GetRequestWorkflowCommand extends BaseWorkflowCommand {
    public GetRequestWorkflowCommand(ActionConfiguration actionConfiguration, ObjectMapper objectMapper) {
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
        String workflowId = getTrimmedStringDataValueSafelyFromFormData(formData, WORKFLOW_ID);
        if (StringUtils.isEmpty(workflowId)) {
            throw new AppsmithPluginException(WorkflowPluginError.WORKFLOW_UNDEFINED);
        }
        queryParams.add(WORKFLOW_ID, workflowId);

        String requestStatus = getTrimmedStringDataValueSafelyFromFormData(formData, REQUEST_STATUS);
        if (StringUtils.isNotEmpty(requestStatus)) {
            queryParams.add(STATUS, requestStatus);
        }

        List<Map<String, String>> requestNameListMap =
                getDataValueSafelyFromFormData(formData, REQUEST_NAMES, new TypeReference<>() {});
        if (CollectionUtils.isNotEmpty(requestNameListMap)) {
            List<String> requestNames = requestNameListMap.stream()
                    .map(value -> value.getOrDefault(REQUEST_NAME, ""))
                    .filter(StringUtils::isNotEmpty)
                    .toList();
            if (!requestNames.isEmpty()) {
                queryParams.put(REQUEST_NAME, requestNames);
            }
        }

        String limit = getTrimmedStringDataValueSafelyFromFormData(formData, LIMIT);
        if (StringUtils.isNotEmpty(limit)) {
            queryParams.add(COUNT, limit);
        }

        String skip = getTrimmedStringDataValueSafelyFromFormData(formData, SKIP);
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
