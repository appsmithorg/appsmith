package com.appsmith.server.workflows.proxy;

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
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class ProxyWorkflowServiceCECompatibleTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    ProxyWorkflowService proxyWorkflowService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    void getWorkflowHistory() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> proxyWorkflowService
                .getWorkflowHistory(new LinkedMultiValueMap<>())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void getWorkflowHistoryByWorkflowId() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> proxyWorkflowService
                .getWorkflowHistoryByWorkflowId("random-workflow-id", new LinkedMultiValueMap<>())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }
}
