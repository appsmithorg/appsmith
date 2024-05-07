package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "027", id = "new-action-compound-index-datasource-id", author = " ")
public class Migration027AddIndexDatasourceIdAndDeletedInAction {
    private final MongoTemplate mongoTemplate;

    private static final String PUBLISHED_ACTION_COMPOUND_INDEX_DATASOURCE_ID =
            "publishedAction_datasourceId_deleted_compound_index";
    private static final String UNPUBLISHED_ACTION_COMPOUND_INDEX_DATASOURCE_ID =
            "unpublishedAction_datasourceId_deleted_compound_index";

    private static final String UNPUBLISHED_ACTION = NewAction.Fields.unpublishedAction;
    private static final String PUBLISHED_ACTION = NewAction.Fields.publishedAction;

    private static final String PATH_DELIMITER = ".";

    public Migration027AddIndexDatasourceIdAndDeletedInAction(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexInNewActionCollection() {
        Index publishedIndex = makeIndex(createFullPathName(PUBLISHED_ACTION), FieldName.DELETED, FieldName.DELETED_AT)
                .named(PUBLISHED_ACTION_COMPOUND_INDEX_DATASOURCE_ID);
        Index unpublishedIndex = makeIndex(
                        createFullPathName(UNPUBLISHED_ACTION), FieldName.DELETED, FieldName.DELETED_AT)
                .named(UNPUBLISHED_ACTION_COMPOUND_INDEX_DATASOURCE_ID);

        ensureIndexes(mongoTemplate, NewAction.class, publishedIndex);
        ensureIndexes(mongoTemplate, NewAction.class, unpublishedIndex);
    }

    private static String createFullPathName(String path) {
        return path + PATH_DELIMITER + FieldName.DATASOURCE + PATH_DELIMITER + Datasource.Fields.id;
    }
}
