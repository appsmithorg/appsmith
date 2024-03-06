package com.appsmith.server.workflows.helpers;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.dtos.RtsResponseDTO;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Objects;

import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.FETCH_WORKFLOW_RUNS;
import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.FETCH_WORKFLOW_RUN_ACTIVITIES;
import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.RESOLVE_APPROVAL_REQUEST;
import static com.appsmith.server.workflows.constants.WorkflowProxyRequests.TRIGGER_WORKFLOW_ON_PROXY;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.APPROVAL_REQUEST_RESOLUTION_URI;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.WORKFLOW_RUNS_URI;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.WORKFLOW_RUN_ACTIVITIES_URI;
import static com.appsmith.server.workflows.constants.WorkflowProxyUrls.WORKFLOW_TRIGGER_URI;

@Slf4j
@Component
public class WorkflowProxyHelperImpl implements WorkflowProxyHelper {

    private final WebClient webClient;
    private final CommonConfig commonConfig;

    public WorkflowProxyHelperImpl(CommonConfig commonConfig) {
        webClient = WebClientUtils.builder().build();
        this.commonConfig = commonConfig;
    }

    private String getWorkflowProxyUrlString(String uri) {
        return commonConfig.getWorkflowProxyUrl() + uri;
    }

    @Override
    public Mono<Map<String, Object>> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO) {
        UriComponentsBuilder uriBuilder =
                UriComponentsBuilder.fromUriString(getWorkflowProxyUrlString(APPROVAL_REQUEST_RESOLUTION_URI));
        return webClient
                .put()
                .uri(uriBuilder.build().toUri())
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(approvalRequestResolutionProxyDTO))
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        clientResponse -> handleWorkflowProxyError(clientResponse, RESOLVE_APPROVAL_REQUEST))
                .bodyToMono(RtsResponseDTO.class)
                .map(RtsResponseDTO::getData);
    }

    @Override
    public Mono<Map<String, Object>> triggerWorkflowOnProxy(
            WorkflowTriggerProxyDTO workflowTriggerProxyDTO, HttpHeaders httpHeaders) {
        UriComponentsBuilder uriBuilder =
                UriComponentsBuilder.fromUriString(getWorkflowProxyUrlString(WORKFLOW_TRIGGER_URI));
        return webClient
                .post()
                .uri(uriBuilder.build().toUri())
                .headers(httpHeader -> httpHeader.addAll(httpHeaders))
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(workflowTriggerProxyDTO))
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        clientResponse -> handleWorkflowProxyError(clientResponse, TRIGGER_WORKFLOW_ON_PROXY))
                .bodyToMono(RtsResponseDTO.class)
                .map(RtsResponseDTO::getData);
    }

    @Override
    public Mono<Map<String, Object>> getWorkflowRunActivities(String workflowId, String runId) {
        String getWorkflowRunActivitiesUri = String.format(WORKFLOW_RUN_ACTIVITIES_URI, workflowId, runId);
        UriComponentsBuilder uriBuilder =
                UriComponentsBuilder.fromUriString(getWorkflowProxyUrlString(getWorkflowRunActivitiesUri));

        return webClient
                .get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        clientResponse -> handleWorkflowProxyError(clientResponse, FETCH_WORKFLOW_RUN_ACTIVITIES))
                .bodyToMono(RtsResponseDTO.class)
                .map(RtsResponseDTO::getData);
    }

    @Override
    public Mono<Map<String, Object>> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams) {
        String getWorkflowRunsUri = String.format(WORKFLOW_RUNS_URI, workflowId);
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(
                        getWorkflowProxyUrlString(getWorkflowRunsUri))
                .queryParams(queryParams);

        return webClient
                .get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        clientResponse -> handleWorkflowProxyError(clientResponse, FETCH_WORKFLOW_RUNS))
                .bodyToMono(RtsResponseDTO.class)
                .map(RtsResponseDTO::getData);
    }

    private Mono<? extends Throwable> handleWorkflowProxyError(
            ClientResponse clientResponse, String workflowProxyRequest) {
        return clientResponse
                .toEntity(RtsResponseDTO.class)
                .doOnError(error -> {
                    throw new AppsmithException(
                            AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED,
                            workflowProxyRequest,
                            "No Status",
                            error.getMessage());
                })
                .flatMap(entity -> {
                    log.error("Error while requesting from Workflow proxy: {}", entity.toString());
                    if (Objects.isNull(entity.getBody())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED,
                                entity.getStatusCode(),
                                "No Response from Proxy"));
                    }
                    return Mono.error(new AppsmithException(
                            AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED,
                            workflowProxyRequest,
                            entity.getStatusCode(),
                            entity.getBody().getMessage()));
                });
    }
}
