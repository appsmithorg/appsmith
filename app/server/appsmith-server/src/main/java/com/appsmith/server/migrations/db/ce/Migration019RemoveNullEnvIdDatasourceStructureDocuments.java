package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.constants.FieldName;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@Slf4j
@ChangeUnit(order = "019", id = "delete-null-envId-key-document", author = " ")
public class Migration019RemoveNullEnvIdDatasourceStructureDocuments {

    private final MongoTemplate mongoTemplate;
    private static final String environmentId = FieldName.ENVIRONMENT_ID;

    public Migration019RemoveNullEnvIdDatasourceStructureDocuments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // We're handling rollbacks using marker fields, so we don't need to implement this
    }

    @Execution
    public void executeMigration() {
        mongoTemplate.remove(new Query().addCriteria(nullEnvironmentIdCriterion()), DatasourceStorageStructure.class);
    }

    private Criteria nullEnvironmentIdCriterion() {
        return new Criteria()
                .orOperator(
                        Criteria.where(environmentId).is(null),
                        Criteria.where(environmentId).exists(false));
    }
}
