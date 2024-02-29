package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "011-ee-01", id = "adding-flag-to-workspaces-before-creating-environments", author = " ")
public class Migration011EE01AddFlagToWorkspaceBeforeCreatingEnvironments {

    private final MongoTemplate mongoTemplate;
    private static final String migrationFlag = "hasEnvironments";

    public Migration011EE01AddFlagToWorkspaceBeforeCreatingEnvironments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {
        // We don't care about failure scenarios, we would simply retry
    }

    @Execution
    public void executeMigration() {
        // Temporarily mark all workspaces for processing
        mongoTemplate.updateMulti(
                new Query().addCriteria(getValidWorkspacesToAddEnvs()),
                new Update().set(migrationFlag, false),
                Workspace.class);
    }

    public static Criteria getValidWorkspacesToAddEnvs() {
        return new Criteria()
                .andOperator(
                        // Check for migration flag
                        where(migrationFlag).exists(false),
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)),
                        where(Workspace.Fields.defaultPermissionGroups).exists(true),
                        where(Workspace.Fields.defaultPermissionGroups).not().size(0));
    }
}
