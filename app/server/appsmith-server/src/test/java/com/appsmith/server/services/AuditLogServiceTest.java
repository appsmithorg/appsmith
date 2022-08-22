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

    // TODO Add tests once the filters API is completed
    @Test
    void get() { }
}