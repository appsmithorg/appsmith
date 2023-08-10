package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.migrations.DatabaseChangelog1;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "012", id = "remove-structure-from-within-datasource-modified")
public class Migration012RemoveStructureFromWithinDatasource {

    private final MongoOperations mongoOperations;

    private final MongoTemplate mongoTemplate;

    public Migration012RemoveStructureFromWithinDatasource(
            MongoOperations mongoOperations, MongoTemplate mongoTemplate) {
        this.mongoOperations = mongoOperations;
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
        // We don't need a rollback strategy because we don't care about this value anymore
    }

    @Execution
    public void executeMigration() {
        DatabaseChangelog1.dropIndexIfExists(
                mongoTemplate, DatasourceStorageStructure.class, "dsConfigStructure_dsId_envId");

        DatabaseChangelog1.ensureIndexes(
                mongoTemplate,
                DatasourceStorageStructure.class,
                DatabaseChangelog1.makeIndex("datasourceId", "environmentId")
                        .unique()
                        .named("dsConfigStructure_dsId_envId"));

        Query query = query(where("structure").exists(true));

        Update update = new Update().unset("structure");

        mongoOperations.updateMulti(query, update, Datasource.class);
    }
}
