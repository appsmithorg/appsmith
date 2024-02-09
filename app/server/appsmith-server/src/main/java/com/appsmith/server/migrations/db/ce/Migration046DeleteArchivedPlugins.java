package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Map;

@Slf4j
@ChangeUnit(order = "046", id = "delete-archived-pluginsd", author = "")
@RequiredArgsConstructor
public class Migration046DeleteArchivedPlugins {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void deleteArchivedPlugins() {
        // Not using repositories and Q-classes here so we can remove the `BaseDomain` inheritance on `WorkspacePlugin`.
        mongoTemplate.remove(
                Query.query(new Criteria()
                        .orOperator(
                                Criteria.where(FieldName.DELETED).is(true),
                                Criteria.where(FieldName.DELETED_AT).ne(null))),
                Plugin.class);

        mongoTemplate.updateMulti(
                Query.query(Criteria.where("plugins." + FieldName.DELETED).is(true)),
                new Update().pull("plugins", Map.of(FieldName.DELETED, true)),
                Workspace.class);
    }
}
