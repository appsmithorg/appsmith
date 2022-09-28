package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.AuditLog;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Date;
import java.util.List;

public interface CustomAuditLogRepository extends AppsmithRepository<AuditLog> {

    Flux<AuditLog> getAuditLog(boolean isDate, Date startDate, Date endDate, List<String> events, List<String> emails, String resourceType, String resourceId, int sortOrder, String cursor, int recordLimit, AclPermission aclPermission);

    Mono<Long> updateAuditLogByEventNameUserAndTimeStamp(String eventName, String userEmail, long time, String name, int timeLimit);
}
