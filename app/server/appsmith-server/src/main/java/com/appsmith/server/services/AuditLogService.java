package com.appsmith.server.services;

import com.appsmith.server.domains.AuditLog;
import reactor.core.publisher.Flux;

public interface AuditLogService{
    public Flux<AuditLog> get();
}
