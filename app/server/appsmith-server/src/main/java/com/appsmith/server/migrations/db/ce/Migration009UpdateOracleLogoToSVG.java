package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "009", id = "update-oracle-logo-to-svg", author = " ")
public class Migration009UpdateOracleLogoToSVG {
    private final MongoTemplate mongoTemplate;

    public Migration009UpdateOracleLogoToSVG(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void updateOracleLogoToSVG() {
        Plugin oraclePlugin = mongoTemplate.findOne(query(where("packageName").is("oracle-plugin")), Plugin.class);
        oraclePlugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        mongoTemplate.save(oraclePlugin);
    }
}
