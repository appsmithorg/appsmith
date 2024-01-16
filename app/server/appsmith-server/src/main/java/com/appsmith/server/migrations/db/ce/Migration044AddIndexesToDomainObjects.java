package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "044", id = "add-index-to-domain-objects", author = "")
public class Migration044AddIndexesToDomainObjects {

    private final MongoTemplate mongoTemplate;

    public Migration044AddIndexesToDomainObjects(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexToDomainObjects() {
        this.addIndexToApplicationCollection();
        this.addIndexToWorkspaceCollection();
        this.addIndexToDatasourceStorageCollection();
    }

    private void addIndexToApplicationCollection() {
        String existingIndexName = "policies.permissionGroups_1";
        String newIndexKeypath = "policies.permissionGroups";

        Index index = makeIndex(newIndexKeypath);

        try {
            dropIndexIfExists(mongoTemplate, Application.class, existingIndexName);
            dropIndexIfExists(mongoTemplate, Application.class, newIndexKeypath);

            ensureIndexes(mongoTemplate, Application.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the additon of index because of {}.",
                    newIndexKeypath,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", newIndexKeypath, e);
        }
    }

    private void addIndexToWorkspaceCollection() {
        String existingIndexName = "policies.permissionGroups_1";
        String newIndexKeypath = "policies.permissionGroups";

        Index index = makeIndex(newIndexKeypath);

        try {
            dropIndexIfExists(mongoTemplate, Workspace.class, existingIndexName);
            dropIndexIfExists(mongoTemplate, Workspace.class, newIndexKeypath);

            ensureIndexes(mongoTemplate, Workspace.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the additon of index because of {}.",
                    newIndexKeypath,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", newIndexKeypath, e);
        }
    }

    private void addIndexToDatasourceStorageCollection() {
        String existingIndexName = "environmentId_1";
        String newIndexKeypath = "environmentId";

        Index index = makeIndex(newIndexKeypath);

        try {
            dropIndexIfExists(mongoTemplate, DatasourceStorage.class, existingIndexName);
            dropIndexIfExists(mongoTemplate, DatasourceStorage.class, newIndexKeypath);

            ensureIndexes(mongoTemplate, DatasourceStorage.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the additon of index because of {}.",
                    newIndexKeypath,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", newIndexKeypath, e);
        }
    }
}
