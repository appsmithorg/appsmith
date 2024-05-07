package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.migrations.DatabaseChangelog1;
import com.appsmith.server.migrations.DatabaseChangelog2;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "016", id = "rename-indexes-with-long-names")
@RequiredArgsConstructor
public class Migration016RenameIndexesWithLongNames {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollBackExecution() {
        // Rollback behaviour is undefined. This migration is idempotent, and only does indexes, so should be fine going
        // back.
    }

    @Execution
    public void executeMigration() {
        // update-index-for-git
        if (dropIndexIfExists(
                mongoTemplate, Application.class, "defaultCollectionId_branchName_deleted_compound_index")) {
            ensureIndexes(
                    mongoTemplate,
                    ActionCollection.class,
                    makeIndex("defaultResources.collectionId", "defaultResources.branchName", "deleted")
                            .named("defaultCollectionId_branchName_deleted"));
        }

        // update-index-for-git
        if (dropIndexIfExists(
                mongoTemplate, Application.class, "defaultApplicationId_branchName_deleted_compound_index")) {
            ensureIndexes(
                    mongoTemplate,
                    Application.class,
                    makeIndex(
                                    "gitApplicationMetadata.defaultApplicationId",
                                    "gitApplicationMetadata.branchName",
                                    "deleted")
                            .named("defaultApplicationId_branchName_deleted"));
        }

        // update-index-for-newAction-actionCollection
        if (dropIndexIfExists(
                mongoTemplate, ActionCollection.class, "unpublishedCollectionPageId_deleted_compound_index")) {
            ensureIndexes(
                    mongoTemplate,
                    ActionCollection.class,
                    makeIndex(
                                    ActionCollection.Fields.unpublishedCollection + "." + FieldName.PAGE_ID,
                                    FieldName.DELETED)
                            .named("unpublishedCollectionPageId_deleted"));
        }

        // update-index-for-newAction-actionCollection
        if (dropIndexIfExists(
                mongoTemplate, ActionCollection.class, "publishedCollectionPageId_deleted_compound_index")) {
            ensureIndexes(
                    mongoTemplate,
                    ActionCollection.class,
                    makeIndex(ActionCollection.Fields.publishedCollection + "." + FieldName.PAGE_ID, FieldName.DELETED)
                            .named("publishedCollectionPageId_deleted"));
        }

        // update-git-indexes
        dropIndexIfExists(
                mongoTemplate, ActionCollection.class, "defaultApplicationId_gitSyncId_deleted_compound_index");
        dropIndexIfExists(mongoTemplate, NewAction.class, "defaultApplicationId_gitSyncId_deleted_compound_index");
        dropIndexIfExists(mongoTemplate, NewPage.class, "defaultApplicationId_gitSyncId_deleted_compound_index");
        DatabaseChangelog2.doAddIndexesForGit(mongoTemplate);

        // organization-to-workspace-indexes-recreate
        if (dropIndexIfExists(
                mongoTemplate,
                Application.class,
                "workspace_application_deleted_gitApplicationMetadata_compound_index")) {
            ensureIndexes(
                    mongoTemplate,
                    Application.class,
                    makeIndex(
                                    Application.Fields.workspaceId,
                                    Application.Fields.name,
                                    Application.Fields.deletedAt,
                                    "gitApplicationMetadata.remoteUrl",
                                    "gitApplicationMetadata.branchName")
                            .unique()
                            .named("workspace_app_deleted_gitApplicationMetadata"));
        }

        DatabaseChangelog2.doAddPermissionGroupIndex(mongoTemplate); // Idempotent index-only migration, do it again.

        // create-index-default-domain-id-default-domain-type
        dropIndexIfExists(
                mongoTemplate,
                PermissionGroup.class,
                "permission_group_domainId_domainType_deleted_deleted_compound_index");
        Index newIndexDefaultDomainIdDefaultDomainTypeDeletedDeletedAt = makeIndex(
                        PermissionGroup.Fields.defaultDomainId,
                        PermissionGroup.Fields.defaultDomainType,
                        FieldName.DELETED,
                        PermissionGroup.Fields.deletedAt)
                .named(
                        Migration011CreateIndexDefaultDomainIdDefaultDomainTypeDropIndexDefaultWorkspaceId
                                .newPermissionGroupIndexNameDefaultDomainIdDefaultDomainType);
        ensureIndexes(mongoTemplate, PermissionGroup.class, newIndexDefaultDomainIdDefaultDomainTypeDeletedDeletedAt);

        // remove-structure-from-within-datasource
        dropIndexIfExists(
                mongoTemplate, DatasourceStorageStructure.class, "dsConfigStructure_datasourceId_envId_compound_index");
        DatabaseChangelog1.ensureIndexes(
                mongoTemplate,
                DatasourceStorageStructure.class,
                DatabaseChangelog1.makeIndex("datasourceId", "environmentId")
                        .unique()
                        .named("dsConfigStructure_dsId_envId"));
    }
}
