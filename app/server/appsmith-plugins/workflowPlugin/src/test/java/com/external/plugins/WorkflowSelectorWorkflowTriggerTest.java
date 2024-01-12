package com.external.plugins;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.exceptions.WorkflowPluginError;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;

import static com.external.plugins.constants.FieldNames.ERROR;
import static org.assertj.core.api.Assertions.assertThat;

public class WorkflowSelectorWorkflowTriggerTest {
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
    public void testExecuteRequestWithoutWorkspaceId() {
        TriggerRequestDTO triggerRequestDTO = new TriggerRequestDTO();
        triggerRequestDTO.setRequestType("WORKFLOW_SELECTOR");

        Mono<TriggerResultDTO> triggerResultDTOMono = workflowPluginExecutor.trigger(null, null, triggerRequestDTO);

        StepVerifier.create(triggerResultDTOMono)
                .assertNext(triggerResultDTO -> {
                    Object trigger = triggerResultDTO.getTrigger();
                    assertThat(trigger).isInstanceOf(HashMap.class);
                    HashMap triggerMap = (HashMap) trigger;
                    assertThat(triggerMap).containsKey(ERROR);
                    assertThat(triggerMap.get(ERROR)).isEqualTo(WorkflowPluginError.WORKSPACE_UNDEFINED.getMessage());
                })
                .verifyComplete();
    }
}
