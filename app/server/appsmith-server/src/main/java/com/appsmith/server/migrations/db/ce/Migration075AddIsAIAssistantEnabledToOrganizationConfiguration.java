package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Organization;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;

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
        // Only set the field where it is missing (null config or field not present).
        Criteria missingField = new Criteria()
                .orOperator(
                        Criteria.where(Organization.Fields.organizationConfiguration)
                                .is(null),
                        Criteria.where("organizationConfiguration.isAIAssistantEnabled")
                                .exists(false));

        Query query = Query.query(missingField);
        query.fields().include(Organization.Fields.id);

        List<Organization> orgsNeedingUpdate = mongoTemplate.find(query, Organization.class);

        if (orgsNeedingUpdate.isEmpty()) {
            return;
        }

        for (Organization org : orgsNeedingUpdate) {
            log.info("OrgID {} is missing AI Config; adding the field.", org.getId());
        }

        mongoTemplate.updateMulti(
                Query.query(missingField),
                new Update().set("organizationConfiguration.isAIAssistantEnabled", false),
                Organization.class);

        for (Organization org : orgsNeedingUpdate) {
            log.info("Successfully added isAIAssistantEnabled for OrgID {}", org.getId());
        }
    }
}
