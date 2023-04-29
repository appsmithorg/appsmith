package com.appsmith.server.migrations.db.ce;


import com.appsmith.external.models.Datasource;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "009", id = "remove-structure-from-within-datasource")
public class Migration009RemoveStructureFromWithinDatasource {

    private final MongoOperations mongoOperations;

    public Migration009RemoveStructureFromWithinDatasource(MongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    @RollbackExecution
    public void rollBackExecution() {
        // We don't need a rollback strategy because we don't care about this value anymore
    }

    @Execution
    public void executeMigration() {
        Query query = query(where("structure").exists(true));

        Update update = new Update().set("structure", null);

        mongoOperations.updateMulti(query, update, Datasource.class);
    }
}
