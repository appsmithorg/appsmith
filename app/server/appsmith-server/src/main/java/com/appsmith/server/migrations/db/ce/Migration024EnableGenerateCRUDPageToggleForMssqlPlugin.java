package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.constants.GenerateCRUDPageConstants.COMPONENT_TYPE_SQL;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * Enable generate CRUD page feature for MsSQL plugin by setting the plugin's generateCRUDPageComponent value to
 * "SQL". Currently, it is set to null.
 */
@ChangeUnit(order = "024", id = "enable-generate-crud-page-for-mssql", author = " ")
public class Migration024EnableGenerateCRUDPageToggleForMssqlPlugin {
    private final MongoTemplate mongoTemplate;

    public Migration024EnableGenerateCRUDPageToggleForMssqlPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void enableGenerateCRUDPageToggle() {
        Plugin mssqlPlugin = mongoTemplate.findOne(query(where("packageName").is("mssql-plugin")), Plugin.class);
        mssqlPlugin.setGenerateCRUDPageComponent(COMPONENT_TYPE_SQL);
        mongoTemplate.save(mssqlPlugin);
    }
}
