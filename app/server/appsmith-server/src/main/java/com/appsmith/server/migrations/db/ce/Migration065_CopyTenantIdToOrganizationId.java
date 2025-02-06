package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.DuplicateKeyException;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.redis.core.ReactiveRedisOperations;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(id = "copy-tenant-id-to-organization-id", order = "065")
public class Migration065_CopyTenantIdToOrganizationId {

    private final ReactiveRedisOperations<String, Object> reactiveRedisOperations;
    private final ObjectMapper objectMapper;
    private final MongoTemplate mongoTemplate;

    private final List<Class<?>> DOMAIN_CLASSES =
            Arrays.asList(User.class, Workspace.class, PermissionGroup.class, UsagePulse.class);

    public Migration065_CopyTenantIdToOrganizationId(
            @Qualifier("reactiveRedisOperations") ReactiveRedisOperations<String, Object> reactiveRedisOperations,
            ObjectMapper objectMapper,
            MongoTemplate mongoTemplate) {
        this.reactiveRedisOperations = reactiveRedisOperations;
        this.objectMapper = objectMapper;
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        migrateTenantCollection();
        migrateMongoCollections();
        migrateRedisData();
    }

    private void migrateTenantCollection() {
        try {
            // Get the single tenant document
            Document tenant = mongoTemplate.findOne(new Query(), Document.class, "tenant");

            if (tenant == null) {
                log.info("No tenant found to migrate");
                return;
            }

            try {
                // Create new organization document
                Document organization = new Document();

                // Copy all fields from tenant to organization
                organization.putAll(tenant);

                // Ensure the _id is preserved
                String tenantId = tenant.getObjectId("_id").toString();
                organization.put("_id", new ObjectId(tenantId));

                // Handle configuration key rename
                if (tenant.containsKey("tenantConfiguration")) {
                    organization.put("organizationConfiguration", tenant.get("tenantConfiguration"));
                    organization.remove("tenantConfiguration");
                }

                // Insert into organization collection
                try {
                    mongoTemplate.insert(organization, "organization");
                    log.info("Successfully migrated tenant to organization with id: {}", tenantId);
                } catch (DuplicateKeyException e) {
                    log.warn("Organization already exists for tenant: {}", tenantId);
                }

            } catch (Exception e) {
                log.error("Error migrating tenant: {}", tenant.get("_id"), e);
            }

        } catch (Exception e) {
            log.error("Error during tenant to organization migration", e);
        }
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

        // Create an update pipeline that copies the value
        List<Document> pipeline = Arrays.asList(new Document("$set", new Document("organizationId", "$tenantId")));

        try {
            long updatedCount = mongoTemplate
                    .getCollection(mongoTemplate.getCollectionName(domainClass))
                    .updateMany(query.getQueryObject(), pipeline)
                    .getModifiedCount();

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
            List<String> sessionKeys = reactiveRedisOperations
                    .keys("spring:session:sessions:*")
                    .collectList()
                    .block();

            if (sessionKeys == null || sessionKeys.isEmpty()) {
                log.info("No session keys found in Redis");
                return;
            }

            int updatedCount = 0;
            for (String sessionKey : sessionKeys) {
                Map<Object, Object> sessionData = reactiveRedisOperations
                        .opsForHash()
                        .entries(sessionKey)
                        .collectMap(entry -> entry.getKey(), entry -> entry.getValue())
                        .block();

                if (sessionData != null && sessionData.containsKey("sessionAttr:SPRING_SECURITY_CONTEXT")) {
                    try {
                        String sessionStr = sessionData
                                .get("sessionAttr:SPRING_SECURITY_CONTEXT")
                                .toString();
                        // Extract the appsmith-session JSON string
                        if (sessionStr.contains("appsmith-session:")) {
                            String jsonStr =
                                    sessionStr.substring(sessionStr.indexOf('{'), sessionStr.lastIndexOf('}') + 1);
                            JsonNode jsonNode = objectMapper.readTree(jsonStr);
                            ObjectNode objectNode = (ObjectNode) jsonNode;

                            if (objectNode.has("tenantId") && !objectNode.has("organizationId")) {
                                // Copy tenantId value to organizationId
                                objectNode.put(
                                        "organizationId",
                                        objectNode.get("tenantId").asText());
                                // Remove tenantId
                                objectNode.remove("tenantId");

                                // Reconstruct the session string with updated JSON
                                String updatedJson = objectMapper.writeValueAsString(objectNode);
                                String updatedSessionStr = "appsmith-session:" + updatedJson;

                                // Convert to byte array if needed
                                reactiveRedisOperations
                                        .opsForHash()
                                        .put(sessionKey, "sessionAttr:SPRING_SECURITY_CONTEXT", updatedSessionStr)
                                        .block();
                                updatedCount++;
                            }
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
