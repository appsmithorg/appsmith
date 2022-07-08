package com.appsmith.server.services;

import com.appsmith.server.domains.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

@SpringBootTest
@Slf4j
@DirtiesContext
class AuditLogServiceTest {
    @MockBean
    AuditLogService auditLogService;

    @Test
    void get() {
        AuditLog auditLog1 = new AuditLog();
        auditLog1.setName("testEvent1");
        auditLog1.setUserId("testUserId1");

        AuditLog auditLog2 = new AuditLog();
        auditLog2.setName("testEvent2");
        auditLog2.setUserId("testUserId2");

        Flux<AuditLog> auditLogFlux = Flux.just(auditLog1, auditLog2);
        Mockito.when(auditLogService.get()).thenReturn(auditLogFlux);

        StepVerifier.create(auditLogFlux)
                .expectNext(auditLog1, auditLog2)
                .expectComplete()
                .verify();
    }
}