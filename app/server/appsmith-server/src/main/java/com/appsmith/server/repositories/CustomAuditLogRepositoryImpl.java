package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.QAuditLog;
import com.mongodb.client.result.UpdateResult;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomAuditLogRepositoryImpl extends BaseAppsmithRepositoryImpl<AuditLog>
        implements CustomAuditLogRepository {

    @Autowired
    public CustomAuditLogRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<AuditLog> getAuditLog(
            boolean isDate,
            Date startDate,
            Date endDate,
            List<String> events,
            List<String> emails,
            String resourceType,
            String resourceId,
            int sortOrder,
            String cursor,
            int recordLimit,
            AclPermission aclPermission) {
        List<Criteria> criteriaList = new ArrayList<>();

        if (isDate) {
            criteriaList.add(where(AuditLog.Fields.timestamp).gte(startDate).lte(endDate));
        }

        if (!Optional.ofNullable(events).isEmpty() && events.size() > 0) {
            criteriaList.add(where(AuditLog.Fields.event).in(events));
        }

        if (!Optional.ofNullable(emails).isEmpty() && emails.size() > 0) {
            criteriaList.add(where(AuditLog.Fields.user + "." + fieldName(QAuditLog.auditLog.user.email))
                    .in(emails));
        }

        if (!Optional.ofNullable(resourceType).isEmpty() && !resourceType.isEmpty()) {
            criteriaList.add(where(AuditLog.Fields.resource + "." + fieldName(QAuditLog.auditLog.resource.type))
                    .is(resourceType));
        }

        if (!Optional.ofNullable(resourceId).isEmpty() && !resourceId.isEmpty()) {
            criteriaList.add(where(AuditLog.Fields.resource + "." + fieldName(QAuditLog.auditLog.resource.id))
                    .is(resourceId));
        }

        Sort sort;
        if (sortOrder > 0) {
            sort = Sort.by(Sort.Direction.ASC, AuditLog.Fields.timestamp);
            if (!Optional.ofNullable(cursor).isEmpty() && !cursor.isEmpty()) {
                criteriaList.add(where(AuditLog.Fields.id).gt(new ObjectId(cursor)));
            }
        } else {
            sort = Sort.by(Sort.Direction.DESC, AuditLog.Fields.timestamp);
            if (!Optional.ofNullable(cursor).isEmpty() && !cursor.isEmpty()) {
                criteriaList.add(where(AuditLog.Fields.id).lt(new ObjectId(cursor)));
            }
        }
        return queryBuilder()
                .criteria(criteriaList)
                .fields((List<String>) null)
                .permission(aclPermission)
                .sort(sort)
                .limit(recordLimit)
                .all();
    }

    @Override
    public Mono<Long> updateAuditLogByEventNameUserAndTimeStamp(
            String eventName, String userEmail, String resourceId, long time, String name, int timeLimit) {
        Update update = new Update();
        update.set(AuditLog.Fields.timestamp, new Date(time))
                .set(AuditLog.Fields.resource + "." + fieldName(QAuditLog.auditLog.resource.name), name);

        long lastUpdatedTimeCriteria = Instant.now().minusSeconds(timeLimit).toEpochMilli();
        Query query = new Query();
        query.addCriteria(where(AuditLog.Fields.event).is(eventName));
        query.addCriteria(where(AuditLog.Fields.user + "." + fieldName(QAuditLog.auditLog.user.email))
                .is(userEmail));
        query.addCriteria(where(AuditLog.Fields.timestamp).gte(new Date(lastUpdatedTimeCriteria)));
        query.addCriteria(where(AuditLog.Fields.resource + "." + fieldName(QAuditLog.auditLog.resource.id))
                .is(resourceId));

        return mongoOperations.updateFirst(query, update, AuditLog.class).map(UpdateResult::getModifiedCount);
    }
}
