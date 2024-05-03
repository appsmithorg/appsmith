package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@ChangeUnit(order = "052", id = "remove-invalid-plugins-in-workspaces")
@RequiredArgsConstructor
public class Migration052RemoveInvalidPluginsInWorkspaces {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        mongoTemplate.updateMulti(
                new Query(),
                new Update().pull(Workspace.Fields.plugins, new Document(FieldName.PLUGIN_ID, null)),
                Workspace.class);
    }
}
