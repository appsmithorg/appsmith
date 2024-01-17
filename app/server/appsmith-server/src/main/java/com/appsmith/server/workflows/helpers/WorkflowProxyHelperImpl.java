package com.appsmith.server.workflows.helpers;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.FETCH_WORKFLOW_HISTORY;
import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.RESOLVE_APPROVAL_REQUEST;
import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.TRIGGER_WORKFLOW_ON_PROXY;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.APPROVAL_REQUEST_RESOLUTION_URI;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.WORKFLOW_HISTORY_URI;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.WORKFLOW_TRIGGER_URI;

@Component
public class WorkflowProxyHelperImpl implements WorkflowProxyHelper {

    private final WebClient webClient;
    private final CommonConfig commonConfig;
    private final ObjectMapper objectMapper;

    public WorkflowProxyHelperImpl(CommonConfig commonConfig, ObjectMapper objectMapper) {
        webClient = WebClientUtils.builder().build();
        this.commonConfig = commonConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<JsonNode> getWorkflowHistoryFromProxySource(MultiValueMap<String, String> filters) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(
                        getWorkflowProxyUrlString(WORKFLOW_HISTORY_URI))
                .queryParams(filters);

        Mono<ResponseEntity<String>> responseEntityMono =
                webClient.get().uri(uriBuilder.build().toUri()).retrieve().toEntity(String.class);

        return checkWorkflowResponseForError(responseEntityMono, FETCH_WORKFLOW_HISTORY);
    }

    private String getWorkflowProxyUrlString(String uri) {
        return commonConfig.getWorkflowProxyUrl() + uri;
    }

    private Mono<JsonNode> checkWorkflowResponseForError(
            Mono<ResponseEntity<String>> responseEntityMono, String workflowRequest) {
        return responseEntityMono
                .doOnError(error -> {
                    throw new AppsmithException(
                            AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED, workflowRequest, error.getMessage());
                })
                .flatMap(responseEntity -> {
                    if (responseEntity.getStatusCode().isError()) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED,
                                workflowRequest,
                                responseEntity.getStatusCode()));
                    }
                    JsonNode jsonNodeResponse = null;
                    try {
                        jsonNodeResponse = objectMapper.readTree(responseEntity.getBody());
                        return Mono.just(jsonNodeResponse);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e.getMessage()));
                    }
                });
    }

    @Override
    public Mono<JsonNode> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO) {
        UriComponentsBuilder uriBuilder =
                UriComponentsBuilder.fromUriString(getWorkflowProxyUrlString(APPROVAL_REQUEST_RESOLUTION_URI));
        Mono<ResponseEntity<String>> responseEntityMono = webClient
                .put()
                .uri(uriBuilder.build().toUri())
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(approvalRequestResolutionProxyDTO))
                .retrieve()
                .toEntity(String.class);

        return checkWorkflowResponseForError(responseEntityMono, RESOLVE_APPROVAL_REQUEST);
    }

    @Override
    public Mono<JsonNode> triggerWorkflowOnProxy(
            WorkflowTriggerProxyDTO workflowTriggerProxyDTO, HttpHeaders httpHeaders) {
        UriComponentsBuilder uriBuilder =
                UriComponentsBuilder.fromUriString(getWorkflowProxyUrlString(WORKFLOW_TRIGGER_URI));
        Mono<ResponseEntity<String>> responseEntityMono = webClient
                .post()
                .uri(uriBuilder.build().toUri())
                .headers(httpHeader -> httpHeader.addAll(httpHeaders))
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(workflowTriggerProxyDTO))
                .retrieve()
                .toEntity(String.class);

        return checkWorkflowResponseForError(responseEntityMono, TRIGGER_WORKFLOW_ON_PROXY);
    }
}
