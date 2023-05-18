package com.appsmith.server.services;


import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.server.domains.NewAction;

import com.appsmith.server.solutions.ActionExecutionSolution;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ActionServiceTest {

    @Autowired
    ActionExecutionSolution actionExecutionSolution;

    @MockBean
    VariableReplacementService variableReplacementService;


    @Test
    @WithUserDetails(value = "api_user")
    public void testServerSideVariableSubstitution() {

        String mockRenderedValue = "Server Rendered Value";
        ActionConfiguration mockConfiguration = new ActionConfiguration();
        mockConfiguration.setBody(mockRenderedValue);

        Mockito.when(variableReplacementService.replaceValue(Mockito.any())).thenReturn(Mono.just(mockRenderedValue));
        Mockito.when(variableReplacementService.replaceAll(Mockito.any(AppsmithDomain.class)))
                .thenReturn(Mono.just(mockConfiguration));

        ActionDTO unpublishedAction = new ActionDTO();
        unpublishedAction.setActionConfiguration(new ActionConfiguration());
        unpublishedAction.getActionConfiguration().setBody("<<variable>>");

        NewAction action = new NewAction();
        action.setUnpublishedAction(unpublishedAction);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId("actionId");
        executeActionDTO.setViewMode(false);

        Mono<ActionDTO> renderedActionMono = actionExecutionSolution.getValidActionForExecution(executeActionDTO, "actionId", action);

        StepVerifier.create(renderedActionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO.getActionConfiguration()).isNotNull();
                    assertThat(actionDTO.getActionConfiguration().getBody()).isEqualTo("Server Rendered Value");
                })
                .verifyComplete();
    }
}