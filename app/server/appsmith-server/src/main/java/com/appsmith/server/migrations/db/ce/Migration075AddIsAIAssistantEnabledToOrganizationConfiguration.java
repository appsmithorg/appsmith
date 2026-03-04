package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Organization;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "075", id = "add-is-ai-assistant-enabled-to-organization-configuration")
public class Migration075AddIsAIAssistantEnabledToOrganizationConfiguration {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        // Ensure isAIAssistantEnabled exists on all organizations so that
        // getAIConfig and other code can rely on the field being present.

        // Case 1: organizationConfiguration is null — must set the whole object
        // because MongoDB cannot use $set on a dotted path when the parent is null.
        Criteria nullConfig =
                Criteria.where(Organization.Fields.organizationConfiguration).is(null);

        // Case 2: organizationConfiguration exists but the flag is missing
        Criteria missingFlagOnExistingConfig = new Criteria()
                .andOperator(
                        Criteria.where(Organization.Fields.organizationConfiguration)
                                .ne(null),
                        Criteria.where("organizationConfiguration.isAIAssistantEnabled")
                                .exists(false));

        // For null configs, set the whole object to avoid "Cannot create field in null element" error
        UpdateResult nullResult = mongoTemplate.updateMulti(
                Query.query(nullConfig),
                new Update().set("organizationConfiguration", new org.bson.Document("isAIAssistantEnabled", false)),
                Organization.class);

        // For existing configs, just set the nested field
        UpdateResult missingResult = mongoTemplate.updateMulti(
                Query.query(missingFlagOnExistingConfig),
                new Update().set("organizationConfiguration.isAIAssistantEnabled", false),
                Organization.class);

        long total = nullResult.getModifiedCount() + missingResult.getModifiedCount();
        if (total > 0) {
            log.info(
                    "Added isAIAssistantEnabled for {} organization(s) ({} null config, {} missing flag).",
                    total,
                    nullResult.getModifiedCount(),
                    missingResult.getModifiedCount());
        }
    }
}
