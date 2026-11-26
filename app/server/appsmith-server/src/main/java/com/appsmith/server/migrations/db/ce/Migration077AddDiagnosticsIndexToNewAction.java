package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

/**
 * Adds the index that answers the support diagnostics action counts without reading the action documents.
 * <p>
 * The datasource ID comes first so that the planner does not pick this index for queries that filter on {@code deleted},
 * {@code deletedAt} or the plugin type but have no selective index. Almost every query on the collection has the first two.
 * <p>
 * The index is optional: without it the counts are slow. A failed build is logged, does not stop startup, and is not
 * retried.
 */
@Slf4j
@ChangeUnit(order = "077", id = "add-diagnostics-index-to-new-action", author = "")
public class Migration077AddDiagnosticsIndexToNewAction {

    public static final String DIAGNOSTICS_EDITABLE_ACTIONS = "diagnostics_editable_actions";

    private final MongoTemplate mongoTemplate;

    public Migration077AddDiagnosticsIndexToNewAction(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // The index does not change query results, so it is kept.
    }

    @Execution
    public void addDiagnosticsIndex() {
        Index index = diagnosticsIndex();
        try {
            ensureIndexes(mongoTemplate, NewAction.class, index);
        } catch (Exception exception) {
            log.error(
                    "An error occurred while creating the index : {} with keys {}. Support diagnostics counts may time out on a large"
                            + " newAction collection until an administrator creates it.",
                    DIAGNOSTICS_EDITABLE_ACTIONS,
                    index.getIndexKeys().toJson(),
                    exception);
        }
    }

    public static Index diagnosticsIndex() {
        return makeIndex(
                        NewAction.Fields.unpublishedAction + ".datasource._id",
                        NewAction.Fields.pluginType,
                        NewAction.Fields.deletedAt,
                        NewAction.Fields.deleted,
                        NewAction.Fields.unpublishedAction_deletedAt)
                .named(DIAGNOSTICS_EDITABLE_ACTIONS)
                .background();
    }
}
