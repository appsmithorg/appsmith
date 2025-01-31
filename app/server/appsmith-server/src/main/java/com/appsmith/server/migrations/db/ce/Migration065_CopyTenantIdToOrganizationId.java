package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(id = "copy-tenant-id-to-organization-id", order = "065")
public class Migration065_CopyTenantIdToOrganizationId {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final MongoTemplate mongoTemplate;

    private final List<Class<?>> DOMAIN_CLASSES =
            Arrays.asList(User.class, Workspace.class, PermissionGroup.class, UsagePulse.class);

    public Migration065_CopyTenantIdToOrganizationId(
            RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper, MongoTemplate mongoTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        migrateMongoCollections();
        migrateRedisData();
    }

    private void migrateMongoCollections() {
        for (Class<?> domainClass : DOMAIN_CLASSES) {
            try {
                migrateCollection(domainClass);
            } catch (Exception e) {
                log.error("Error while migrating collection for {}: ", domainClass.getSimpleName(), e);
            }
        }
    }

    private void migrateCollection(Class<?> domainClass) {
        Query query =
                new Query(where("tenantId").exists(true).and("organizationId").exists(false));

        Update update = new Update().set("organizationId", "$tenantId");

        try {
            long updatedCount =
                    mongoTemplate.updateMulti(query, update, domainClass).getModifiedCount();
            log.info(
                    "Successfully copied tenantId to organizationId for {} documents in collection: {}",
                    updatedCount,
                    domainClass.getSimpleName());
        } catch (Exception e) {
            log.error(
                    "Error while copying tenantId to organizationId for collection {}: ",
                    domainClass.getSimpleName(),
                    e);
            throw e;
        }
    }

    private void migrateRedisData() {
        try {
            // Get all session keys
            Set<String> sessionKeys = redisTemplate.keys("session:*");

            if (sessionKeys == null || sessionKeys.isEmpty()) {
                log.info("No session keys found in Redis");
                return;
            }

            int updatedCount = 0;
            for (String sessionKey : sessionKeys) {
                String sessionData = redisTemplate.opsForValue().get(sessionKey);
                if (sessionData != null) {
                    try {
                        // Parse the session data
                        Document sessionDoc = Document.parse(sessionData);
                        boolean updated = false;

                        // Update user data if present
                        if (sessionDoc.containsKey("user")) {
                            Document userDoc = sessionDoc.get("user", Document.class);
                            if (userDoc.containsKey("tenantId") && !userDoc.containsKey("organizationId")) {
                                userDoc.put("organizationId", userDoc.get("tenantId"));
                                sessionDoc.put("user", userDoc);
                                updated = true;
                            }
                        }

                        // Update workspace data if present
                        if (sessionDoc.containsKey("workspace")) {
                            Document workspaceDoc = sessionDoc.get("workspace", Document.class);
                            if (workspaceDoc.containsKey("tenantId") && !workspaceDoc.containsKey("organizationId")) {
                                workspaceDoc.put("organizationId", workspaceDoc.get("tenantId"));
                                sessionDoc.put("workspace", workspaceDoc);
                                updated = true;
                            }
                        }

                        if (updated) {
                            // Save the updated session data back to Redis
                            redisTemplate.opsForValue().set(sessionKey, sessionDoc.toJson());
                            updatedCount++;
                        }
                    } catch (Exception e) {
                        log.error("Error processing Redis session key {}: ", sessionKey, e);
                    }
                }
            }
            log.info("Successfully migrated {} Redis sessions", updatedCount);
        } catch (Exception e) {
            log.error("Error while migrating Redis session data: ", e);
        }
    }
}
