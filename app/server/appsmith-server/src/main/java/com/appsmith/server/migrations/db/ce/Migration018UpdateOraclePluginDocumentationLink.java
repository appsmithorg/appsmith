package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "018", id = "update-oracle-doc-link", author = " ")
public class Migration018UpdateOraclePluginDocumentationLink {
    private final MongoTemplate mongoTemplate;

    public Migration018UpdateOraclePluginDocumentationLink(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void updateOracleDocumentationLink() {
        Plugin oraclePlugin = mongoTemplate.findOne(query(where("packageName").is("oracle-plugin")), Plugin.class);
        oraclePlugin.setDocumentationLink(
                "https://docs.appsmith.com/reference/datasources/querying-oracle#create-queries");
        mongoTemplate.save(oraclePlugin);
    }
}
