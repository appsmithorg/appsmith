package com.appsmith.server.repositories;

import com.appsmith.server.domains.AuditLog;
import com.querydsl.core.annotations.QueryEntity;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.stereotype.Repository;

@QueryEntity
@Document
@Repository
public interface AuditLogRepository extends BaseRepository<AuditLog, String>, CustomAuditLogRepository {}
