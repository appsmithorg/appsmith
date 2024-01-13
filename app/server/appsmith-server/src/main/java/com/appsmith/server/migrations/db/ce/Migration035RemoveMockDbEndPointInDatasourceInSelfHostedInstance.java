package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.solutions.EnvManager;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Slf4j
@ChangeUnit(order = "035", id = "remove-mockdb-endpoint-in-datasource-self-hosted-instance", author = " ")
public class Migration035RemoveMockDbEndPointInDatasourceInSelfHostedInstance {

    private final MongoTemplate mongoTemplate;

    private final CommonConfig commonConfig;

    private final EnvManager envManager;

    public Migration035RemoveMockDbEndPointInDatasourceInSelfHostedInstance(
            MongoTemplate mongoTemplate, CommonConfig commonConfig, EnvManager envManager) {
        this.mongoTemplate = mongoTemplate;
        this.commonConfig = commonConfig;
        this.envManager = envManager;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void removeMockDbEndpointInDatasource() {
        // This migration is applicable for self-hosted instances only.
        // The end point used in templates is redirected to internal postgres db
        // We are now switching to RDS and hence want to remove this endpoint from the datasource and replace it with
        // localhost, so that the existing queries do not break. And the data stored in the db by users is not lost

        // APPSMITH_ENABLE_EMBEDDED_DB && isCloudHosting
        boolean isEmbeddedDbEnabled = !"0".equals(System.getenv("APPSMITH_ENABLE_EMBEDDED_DB"));
        if (isEmbeddedDbEnabled && Boolean.FALSE.equals(commonConfig.isCloudHosting())) {

            mongoTemplate.updateMulti(
                    query(where("datasourceConfiguration.endpoints.host").is("mockdb.internal.appsmith.com")),
                    update("datasourceConfiguration.endpoints.$.host", "127.0.0.1"),
                    DatasourceStorage.class);
        }
    }
}
