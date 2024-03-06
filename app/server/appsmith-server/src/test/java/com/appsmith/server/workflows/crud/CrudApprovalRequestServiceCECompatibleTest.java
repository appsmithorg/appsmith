package com.appsmith.server.workflows.crud;

import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
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
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class CrudApprovalRequestServiceCECompatibleTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    CrudApprovalRequestService crudApprovalRequestService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void create() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> crudApprovalRequestService
                .createApprovalRequest(new ApprovalRequestCreationDTO())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getById() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> crudApprovalRequestService
                .getApprovalRequestById("random-id")
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAll() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> crudApprovalRequestService
                .getPaginatedApprovalRequests(new LinkedMultiValueMap<>())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }
}
