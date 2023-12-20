package com.appsmith.server.workflows.interact;

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
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class InteractWorkflowServiceCECompatibleTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    InteractWorkflowService interactWorkflowService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    void generateBearerTokenForWebhook() {
        AppsmithException unsupportedException = assertThrows(
                AppsmithException.class,
                () -> interactWorkflowService.generateBearerTokenForWebhook("").block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void archiveBearerTokenForWebhook() {
        AppsmithException unsupportedException = assertThrows(
                AppsmithException.class,
                () -> interactWorkflowService.archiveBearerTokenForWebhook("").block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void triggerWorkflow() {
        AppsmithException unsupportedException = assertThrows(
                AppsmithException.class,
                () -> interactWorkflowService.triggerWorkflow("", null, null).block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }
}
