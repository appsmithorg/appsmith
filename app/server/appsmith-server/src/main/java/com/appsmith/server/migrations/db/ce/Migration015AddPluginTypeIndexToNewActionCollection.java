package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "015", id = "app-id-plugin-type-index-for-new-action", author = " ")
public class Migration015AddPluginTypeIndexToNewActionCollection {
    private final MongoTemplate mongoTemplate;

    public Migration015AddPluginTypeIndexToNewActionCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Not getting used here, however it's mandatory to declare
    }

    @Execution
    public void addingIndexToNewAction() {
        Index pluginTypeDeletedAtCompoundIndex = makeIndex(
                        fieldName(QNewAction.newAction.applicationId),
                        fieldName(QNewAction.newAction.pluginType),
                        fieldName(QNewAction.newAction.deletedAt))
                .named("applicationId_pluginType_deletedAt_compound_index");

        ensureIndexes(mongoTemplate, NewAction.class, pluginTypeDeletedAtCompoundIndex);
    }
}
