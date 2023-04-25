package com.appsmith.server.migrations.db.ce;


import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "008", id = "create-index-default-domain-id-default-domain-type", author = " ")
public class Migration008CreateIndexDefaultDomainIdDefaultDomainTypeDropIndexDefaultWorkspaceId {

    private final MongoTemplate mongoTemplate;

    private final static String oldPermissionGroupIndexNameDefaultWorkspaceIdDeleted = "permission_group_workspace_deleted_compound_index";

    private final static String newPermissionGroupIndexNameDefaultDomainIdDefaultDomainType = "permission_group_domainId_domainType_deleted_deleted_compound_index";

    public Migration008CreateIndexDefaultDomainIdDefaultDomainTypeDropIndexDefaultWorkspaceId(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void createNewIndexDefaultDomainIdDefaultDomainTypeAndDropOldIndexDefaultWorkspaceId() {
        dropIndexIfExists(mongoTemplate, PermissionGroup.class, oldPermissionGroupIndexNameDefaultWorkspaceIdDeleted);
        dropIndexIfExists(mongoTemplate, PermissionGroup.class, newPermissionGroupIndexNameDefaultDomainIdDefaultDomainType);

        Index newIndexDefaultDomainIdDefaultDomainTypeDeletedDeletedAt = makeIndex(
                fieldName(QPermissionGroup.permissionGroup.defaultDomainId),
                fieldName(QPermissionGroup.permissionGroup.defaultDomainType),
                fieldName(QPermissionGroup.permissionGroup.deleted),
                fieldName(QPermissionGroup.permissionGroup.deletedAt)
        ).named(newPermissionGroupIndexNameDefaultDomainIdDefaultDomainType);

        ensureIndexes(mongoTemplate, PermissionGroup.class, newIndexDefaultDomainIdDefaultDomainTypeDeletedDeletedAt);
    }
}
