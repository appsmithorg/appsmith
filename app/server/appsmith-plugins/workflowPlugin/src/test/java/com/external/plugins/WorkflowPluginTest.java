package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.exceptions.WorkflowPluginError;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.external.models.ErrorType.ACTION_CONFIGURATION_ERROR;
import static com.appsmith.external.models.ErrorType.WORKFLOW_ERROR;
import static com.external.plugins.constants.FieldNames.REQUEST_TYPE;
import static org.assertj.core.api.Assertions.assertThat;

public class WorkflowPluginTest {
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
    public void testExecuteRequestWithoutRequestType() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        actionConfiguration.setFormData(formData);

        Mono<ActionExecutionResult> executionResultMono =
                workflowPluginExecutor.execute(null, null, actionConfiguration);

        StepVerifier.create(executionResultMono)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getErrorType()).isEqualTo(ACTION_CONFIGURATION_ERROR.toString());
                    assertThat(executionResult.getTitle())
                            .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle());
                    assertThat(executionResult.getBody())
                            .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage(
                                    "Command request type can't be empty."));
                    assertThat(executionResult.getStatusCode())
                            .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getAppErrorCode());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteRequestIllegalCommandRequestType() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        formData.put(REQUEST_TYPE, Map.of("data", "ILLEGAL"));
        actionConfiguration.setFormData(formData);

        Mono<ActionExecutionResult> executionResultMono =
                workflowPluginExecutor.execute(null, null, actionConfiguration);

        StepVerifier.create(executionResultMono)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getErrorType()).isEqualTo(WORKFLOW_ERROR.toString());
                    assertThat(executionResult.getTitle())
                            .isEqualTo(WorkflowPluginError.ILLEGAL_WORKFLOW_COMMAND_REQUEST.getTitle());
                    assertThat(executionResult.getBody())
                            .isEqualTo(WorkflowPluginError.ILLEGAL_WORKFLOW_COMMAND_REQUEST.getMessage("ILLEGAL"));
                    assertThat(executionResult.getStatusCode())
                            .isEqualTo(WorkflowPluginError.ILLEGAL_WORKFLOW_COMMAND_REQUEST.getAppErrorCode());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerRequestWithoutRequestType() {
        TriggerRequestDTO triggerRequestDTO = new TriggerRequestDTO();

        Mono<TriggerResultDTO> triggerResultDTOMono = workflowPluginExecutor.trigger(null, null, triggerRequestDTO);

        StepVerifier.create(triggerResultDTOMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithPluginException.class);
                    assertThat(throwable.getMessage())
                            .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage(
                                    "Trigger request type can't be empty."));
                    return true;
                })
                .verify();
    }

    @Test
    public void testTriggerRequestIllegalRequestType() {
        TriggerRequestDTO triggerRequestDTO = new TriggerRequestDTO();
        triggerRequestDTO.setRequestType("ILLEGAL");

        Mono<TriggerResultDTO> triggerResultDTOMono = workflowPluginExecutor.trigger(null, null, triggerRequestDTO);

        StepVerifier.create(triggerResultDTOMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithPluginException.class);
                    assertThat(throwable.getMessage())
                            .isEqualTo(WorkflowPluginError.ILLEGAL_WORKFLOW_TRIGGER_REQUEST.getMessage("ILLEGAL"));
                    return true;
                })
                .verify();
    }
}
