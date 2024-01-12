package com.external.plugins.pluginActions.trigger;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.FieldNames.DATA;
import static com.external.plugins.constants.FieldNames.ERROR;
import static com.external.plugins.constants.FieldNames.ID;
import static com.external.plugins.constants.FieldNames.LABEL;
import static com.external.plugins.constants.FieldNames.NAME;
import static com.external.plugins.constants.FieldNames.VALUE;
import static com.external.plugins.constants.FieldNames.WORKSPACE_ID;
import static com.external.plugins.constants.Urls.WORKFLOW_URL;

public class WorkflowSelectorWorkflowTrigger extends BaseWorkflowTrigger implements WorkflowTrigger {

    private final ObjectMapper objectMapper;

    public WorkflowSelectorWorkflowTrigger(TriggerRequestDTO triggerRequestDTO, ObjectMapper objectMapper) {
        super(triggerRequestDTO);
        this.objectMapper = objectMapper;
    }

    @Override
    protected HttpMethod getHttpMethod() {
        return HttpMethod.GET;
    }

    @Override
    protected URI getExecutionUri() {
        return getExecutionUriBuilder().queryParams(getQueryParams()).build().toUri();
    }

    @Override
    protected String getRequestBody() {
        return null;
    }

    private MultiValueMap<String, String> getQueryParams() {
        MultiValueMap<String, String> queryParams = new LinkedMultiValueMap<>();
        Map<String, Object> parameters = triggerRequestDTO.getParameters();
        if (CollectionUtils.isEmpty(parameters) || StringUtils.isEmpty((String) parameters.get(WORKSPACE_ID))) {
            throw new AppsmithPluginException(WorkflowPluginError.WORKSPACE_UNDEFINED);
        }
        String workspaceId = (String) parameters.get(WORKSPACE_ID);
        queryParams.add(WORKSPACE_ID, workspaceId);

        return queryParams;
    }

    private UriComponentsBuilder getExecutionUriBuilder() {
        return UriComponentsBuilder.fromUriString(WORKFLOW_URL);
    }

    @Override
    public Mono<TriggerResultDTO> getTriggerResult() {
        TriggerResultDTO errorResult = new TriggerResultDTO();
        try {
            Mono<ResponseEntity<String>> responseEntityMono = getResponse();
            return responseEntityMono.flatMap(responseEntity -> {
                TriggerResultDTO resultDTO = new TriggerResultDTO();
                String responseBodyString = responseEntity.getBody();
                try {
                    JsonNode responseBodyJsonNode = objectMapper.readTree(responseBodyString);
                    if (responseBodyJsonNode.has(DATA)) {
                        JsonNode workflowListJsonNode = responseBodyJsonNode.get(DATA);
                        setTriggerDataInResult(workflowListJsonNode, resultDTO);
                    }
                    return Mono.just(resultDTO);
                } catch (Throwable error) {
                    return populateErrorResultWithDetails(errorResult, error);
                }
            });
        } catch (Throwable error) {
            return populateErrorResultWithDetails(errorResult, error);
        }
    }

    private Mono<TriggerResultDTO> populateErrorResultWithDetails(TriggerResultDTO errorResult, Throwable error) {
        String message = error.getMessage();
        Map<String, String> errorMap = new HashMap<>(Map.of(ERROR, message));
        errorResult.setTrigger(errorMap);
        return Mono.just(errorResult);
    }

    private void setTriggerDataInResult(JsonNode workflowListJsonNode, TriggerResultDTO triggerResultDTO) {
        List<Map<String, String>> labelValues = new ArrayList<>();
        if (workflowListJsonNode.isArray()) {
            workflowListJsonNode.forEach(workflowJsonNode -> {
                if (workflowJsonNode.has(ID) && workflowJsonNode.has(NAME)) {
                    String workflowId = workflowJsonNode.get(ID).asText();
                    String workflowName = workflowJsonNode.get(NAME).asText();
                    labelValues.add(Map.ofEntries(Map.entry(LABEL, workflowName), Map.entry(VALUE, workflowId)));
                }
            });
        }
        triggerResultDTO.setTrigger(labelValues);
    }
}
