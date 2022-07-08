package com.appsmith.server.services;

import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService{
    private final AuditLogRepository repository;

    /**
     * To return all the Audit Logs
     * @return
     */
    public Flux<AuditLog> get(){
        return repository.findAll();
    }
}
