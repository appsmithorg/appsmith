package com.appsmith.server.workflows.interact;

import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatible;
import reactor.core.publisher.Mono;

public interface InteractWorkflowServiceCECompatible extends BaseWorkflowServiceCECompatible {
    Mono<String> generateBearerTokenForWebhook(String workflowId);

    Mono<Boolean> archiveBearerTokenForWebhook(String workflowId);
}
