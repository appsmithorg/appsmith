package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@ChangeUnit(order = "064", id = "add_plugin_doc_url_to_rest_api_plugin")
public class Migration064AddPluginDocUrlToRestApiPlugin {

    private final MongoTemplate mongoTemplate;

    public Migration064AddPluginDocUrlToRestApiPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        Query query = new Query().addCriteria(Criteria.where("packageName").is("restapi-plugin"));
        Update update =
                new Update().set("documentationLink", "https://docs.appsmith.com/connect-data/reference/rest-api");
        mongoTemplate.updateMulti(query, update, Plugin.class);
    }
}
