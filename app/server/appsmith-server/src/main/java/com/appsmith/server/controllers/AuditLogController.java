package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.AuditLogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/logs")
    public Mono<ResponseDTO<List<AuditLog>>> getAuditLogs(@RequestParam MultiValueMap<String, String> params) {
        return auditLogService
                .getAuditLogs(params)
                .map(auditLogs -> new ResponseDTO<>(HttpStatus.OK.value(), auditLogs, null));
    }

    @GetMapping("/filter")
    public Mono<ResponseDTO<AuditLogFilterDTO>> getAuditLogFilter() {
        return auditLogService
                .getAuditLogFilterData()
                .map(auditLogFilterDTO -> new ResponseDTO<>(HttpStatus.OK.value(), auditLogFilterDTO, null));
    }

    @GetMapping("/export")
    public Mono<ResponseEntity<Object>> exportAuditLogsInFile(@RequestParam MultiValueMap<String, String> params) {
        return auditLogService.exportAuditLogs(params).map(fetchedResource -> {
            HttpHeaders responseHeaders = fetchedResource.getHttpHeaders();
            Object applicationResource = fetchedResource.getApplicationResource();
            return new ResponseEntity<>(applicationResource, responseHeaders, HttpStatus.OK);
        });
    }

    @GetMapping("/filter/users")
    public Mono<ResponseDTO<List<String>>> getAllUsers() {
        return auditLogService.getAllUsers().map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }
}
