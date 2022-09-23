package com.appsmith.server.repositories;

import com.appsmith.server.domains.AuditLog;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends BaseRepository<AuditLog, String> {
}
