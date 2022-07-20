package com.appsmith.server.services;


import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class ActionServiceTest {

    @Autowired
    NewActionService newActionService;

    @MockBean
    VariableReplacementService variableReplacementService;


    @Test
    @WithUserDetails(value = "api_user")
    public void testServerSideVariableSubstitution() {

        Mockito.when(variableReplacementService.replaceValue(Mockito.any())).thenReturn(Mono.just("Server Rendered Value"));

        ActionDTO unpublishedAction = new ActionDTO();
        unpublishedAction.setActionConfiguration(new ActionConfiguration());
        unpublishedAction.getActionConfiguration().setBody("<<variable>>");

        NewAction action = new NewAction();
        action.setUnpublishedAction(unpublishedAction);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId("actionId");
        executeActionDTO.setViewMode(false);

        Mono<ActionDTO> renderedActionMono = newActionService.getValidActionForExecution(executeActionDTO, "actionId", action);

        StepVerifier.create(renderedActionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO.getActionConfiguration()).isNotNull();
                    assertThat(actionDTO.getActionConfiguration().getBody()).isEqualTo("Server Rendered Value");
                })
                .verifyComplete();
    }
}