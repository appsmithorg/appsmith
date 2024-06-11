package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Application;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "056", id = "add-idx-branch-name-default-artifact-id", author = " ")
public class Migration056AddBranchNameAndDefaultArtifactIndexToApplication {

    private final MongoTemplate mongoTemplate;

    public static final String BRANCH_NAME_DEFAULT_ARTIFACT_ID_INDEX = "branchName_defaultArtifactId_deletedAt_deleted";

    public Migration056AddBranchNameAndDefaultArtifactIndexToApplication(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void createIndexForApplication() {

        // drop the index if this exists already
        dropIndexIfExists(mongoTemplate, Application.class, BRANCH_NAME_DEFAULT_ARTIFACT_ID_INDEX);

        Index defaultArtifactIdIndex = makeIndex(
                        Application.Fields.gitApplicationMetadata_branchName,
                        Application.Fields.gitApplicationMetadata_defaultArtifactId,
                        Application.Fields.deletedAt,
                        Application.Fields.deleted)
                .named(BRANCH_NAME_DEFAULT_ARTIFACT_ID_INDEX);

        ensureIndexes(mongoTemplate, Application.class, defaultArtifactIdIndex);
    }
}
