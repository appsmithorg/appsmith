package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class CrudWorkflowEntityServiceCECompatibleTest {

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    private CrudWorkflowEntityService crudWorkflowEntityService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void createWorkflowAction() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> crudWorkflowEntityService
                .createWorkflowAction(new ActionDTO(), null)
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void updateWorkflowAction() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> crudWorkflowEntityService
                .updateWorkflowAction("action-id", new ActionDTO())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }
}
