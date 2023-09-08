package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.QAuditLog;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "021-ee-01", id = "ttl-index-for-audit-log", author = " ")
public class Migration021EE01AddTTLIndexForAuditLog {
    private final MongoTemplate mongoTemplate;

    public static final String audit_log_ttl_index = "ttl_index_audit_log_created_time";

    public Migration021EE01AddTTLIndexForAuditLog(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createNewTTLIndexCreatedTimeAuditLog() {
        String createdAtField = fieldName(QAuditLog.auditLog.createdAt);
        long expireAfterSeconds = 31536000; // One year in seconds (365 days * 24 hours * 60 minutes * 60 seconds)

        // drop index if it exists
        dropIndexIfExists(mongoTemplate, AuditLog.class, audit_log_ttl_index);

        // Create the TTL index for the createdAt field
        Index indexAuditLogCreatedTime =
                makeIndex(createdAtField).expire(expireAfterSeconds).named(audit_log_ttl_index);

        // Ensure the index on the AuditLog collection
        ensureIndexes(mongoTemplate, AuditLog.class, indexAuditLogCreatedTime);
    }
}
