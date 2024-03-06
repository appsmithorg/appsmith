package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AuditLogService;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class AuditLogServiceCECompatibleTest {

    @Autowired
    AuditLogService auditLogService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    void setup() {
        Mockito.when(featureFlagService.check(any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    void logEvent_whenFeatureIsNotSupported_returnEmptyMono() {
        for (AnalyticsEvents event : AnalyticsEvents.values()) {
            Mono<AuditLog> resultMono = auditLogService.logEvent(event, new Object(), new HashMap<>());

            // As the method is returning empty mono, asserting for complete directly instead of assertNext
            StepVerifier.create(resultMono).verifyComplete();
        }
    }

    @Test
    void getAuditLogs_whenFeatureIsNotSupported_throwUnsupportedOperationException() {
        StepVerifier.create(auditLogService.getAuditLogs(new LinkedMultiValueMap<>()))
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(AppsmithErrorCode.UNSUPPORTED_OPERATION.getCode());
                })
                .verify();
    }

    @Test
    void getAuditLogFilterData_whenFeatureIsNotSupported_throwUnsupportedOperationException() {
        StepVerifier.create(auditLogService.getAuditLogFilterData())
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(AppsmithErrorCode.UNSUPPORTED_OPERATION.getCode());
                })
                .verify();
    }

    @Test
    void exportAuditLogs_whenFeatureIsNotSupported_throwUnsupportedOperationException() {
        StepVerifier.create(auditLogService.exportAuditLogs(new LinkedMultiValueMap<>()))
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(AppsmithErrorCode.UNSUPPORTED_OPERATION.getCode());
                })
                .verify();
    }

    @Test
    void getAllUsers_whenFeatureIsNotSupported_throwUnsupportedOperationException() {
        StepVerifier.create(auditLogService.getAllUsers())
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(AppsmithErrorCode.UNSUPPORTED_OPERATION.getCode());
                })
                .verify();
    }
}
