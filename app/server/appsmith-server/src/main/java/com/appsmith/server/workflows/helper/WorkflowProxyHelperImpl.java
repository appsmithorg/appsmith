package com.appsmith.server.workflows.helper;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import org.json.JSONObject;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

@Component
public class WorkflowProxyHelperImpl implements WorkflowProxyHelper {

    private final String WORKFLOW_HISTORY_URI = "/workflowHistory";

    private final String APPROVAL_REQUEST_RESOLUTION_URI = "/approvalInbox";
    private final WebClient webClient;
    private final CommonConfig commonConfig;

    public WorkflowProxyHelperImpl(CommonConfig commonConfig) {
        webClient = WebClientUtils.builder().build();
        this.commonConfig = commonConfig;
    }

    @Override
    public Mono<JSONObject> getWorkflowHistoryFromProxySource(MultiValueMap<String, String> filters) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(
                        getWorkflowProxyUrlString(WORKFLOW_HISTORY_URI))
                .queryParams(filters);

        Mono<ResponseEntity<JSONObject>> responseEntityMono =
                webClient.get().uri(uriBuilder.build().toUri()).retrieve().toEntity(JSONObject.class);

        return checkWorkflowResponseForError(responseEntityMono, "Fetching workflow history");
    }

    private String getWorkflowProxyUrlString(String uri) {
        return commonConfig.getWorkflowProxyUrl() + uri;
    }

    private Mono<JSONObject> checkWorkflowResponseForError(
            Mono<ResponseEntity<JSONObject>> responseEntityMono, String workflowRequest) {
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
                    return Mono.just(responseEntity.getBody());
                });
    }

    @Override
    public Mono<JSONObject> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(APPROVAL_REQUEST_RESOLUTION_URI);
        Mono<ResponseEntity<JSONObject>> responseEntityMono = webClient
                .put()
                .uri(uriBuilder.build().toUri())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(BodyInserters.fromValue(approvalRequestResolutionProxyDTO))
                .retrieve()
                .toEntity(JSONObject.class);

        return checkWorkflowResponseForError(responseEntityMono, "Resolve approval request");
    }
}
