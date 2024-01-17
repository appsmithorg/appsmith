package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.exceptions.WorkflowPluginError;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.external.models.ErrorType.WORKFLOW_ERROR;
import static com.external.plugins.constants.FieldNames.REQUEST_ID;
import static com.external.plugins.constants.FieldNames.REQUEST_TYPE;
import static com.external.plugins.constants.FieldNames.WORKFLOW_ID;
import static org.assertj.core.api.Assertions.assertThat;

public class ResolveApprovalRequestWorkflowCommandTest {
    public static class MockSharedConfig implements SharedConfig {

        @Override
        public int getCodecSize() {
            return 10 * 1024 * 1024;
        }

        @Override
        public int getMaxResponseSize() {
            return 10000;
        }

        @Override
        public String getRemoteExecutionUrl() {
            return "";
        }
    }

    WorkflowPlugin.WorkflowPluginExecutor workflowPluginExecutor =
            new WorkflowPlugin.WorkflowPluginExecutor(new GetApprovalRequestWorkflowCommandTest.MockSharedConfig());

    @Test
    public void testExecuteRequestWithoutWorkflowId() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(REQUEST_TYPE, Map.of("data", "RESOLVE_APPROVAL_REQUESTS"));
        actionConfiguration.setFormData(formData);

        Mono<ActionExecutionResult> executionResultMono =
                workflowPluginExecutor.execute(null, null, actionConfiguration);

        StepVerifier.create(executionResultMono)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getErrorType()).isEqualTo(WORKFLOW_ERROR.toString());
                    assertThat(executionResult.getTitle()).isEqualTo(WorkflowPluginError.WORKFLOW_UNDEFINED.getTitle());
                    assertThat(executionResult.getBody())
                            .isEqualTo(WorkflowPluginError.WORKFLOW_UNDEFINED.getMessage());
                    assertThat(executionResult.getStatusCode())
                            .isEqualTo(WorkflowPluginError.WORKFLOW_UNDEFINED.getAppErrorCode());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteRequestWithoutApprovalRequestId() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(REQUEST_TYPE, Map.of("data", "RESOLVE_APPROVAL_REQUESTS"));
        formData.put(WORKFLOW_ID, Map.of("data", "WORKFLOW_ID"));
        actionConfiguration.setFormData(formData);

        Mono<ActionExecutionResult> executionResultMono =
                workflowPluginExecutor.execute(null, null, actionConfiguration);

        StepVerifier.create(executionResultMono)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getErrorType()).isEqualTo(WORKFLOW_ERROR.toString());
                    assertThat(executionResult.getTitle())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_ID_MISSING.getTitle());
                    assertThat(executionResult.getBody())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_ID_MISSING.getMessage());
                    assertThat(executionResult.getStatusCode())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_ID_MISSING.getAppErrorCode());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteRequestWithoutResolution() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(REQUEST_TYPE, Map.of("data", "RESOLVE_APPROVAL_REQUESTS"));
        formData.put(WORKFLOW_ID, Map.of("data", "WORKFLOW_ID"));
        formData.put(REQUEST_ID, Map.of("data", "REQUEST_ID"));
        actionConfiguration.setFormData(formData);

        Mono<ActionExecutionResult> executionResultMono =
                workflowPluginExecutor.execute(null, null, actionConfiguration);

        StepVerifier.create(executionResultMono)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getErrorType()).isEqualTo(WORKFLOW_ERROR.toString());
                    assertThat(executionResult.getTitle())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_RESOLUTION_MISSING.getTitle());
                    assertThat(executionResult.getBody())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_RESOLUTION_MISSING.getMessage());
                    assertThat(executionResult.getStatusCode())
                            .isEqualTo(WorkflowPluginError.APPROVAL_REQUEST_RESOLUTION_MISSING.getAppErrorCode());
                })
                .verifyComplete();
    }
}
