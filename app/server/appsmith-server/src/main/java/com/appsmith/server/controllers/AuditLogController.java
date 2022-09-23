package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping(Url.AUDIT_LOGS_URL)
public class AuditLogController {
    private final AuditLogService auditLogService;
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("")
    public Mono<ResponseDTO<List<AuditLog>>> get() {
        return auditLogService.get()
                .map(auditLogs -> new ResponseDTO<>(HttpStatus.OK.value(), auditLogs, null));
    }
}