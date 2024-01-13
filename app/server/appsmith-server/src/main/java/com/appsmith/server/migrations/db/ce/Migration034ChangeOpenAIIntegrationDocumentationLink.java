package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@Slf4j
@ChangeUnit(order = "034", id = "change-open-ai-integration-documentation-link", author = " ")
public class Migration034ChangeOpenAIIntegrationDocumentationLink {

    private final MongoTemplate mongoTemplate;

    public Migration034ChangeOpenAIIntegrationDocumentationLink(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void changeDocumentationLink() {
        Query pluginFindQuery = new Query();

        pluginFindQuery.addCriteria(
                Criteria.where(FieldNameCE.PACKAGE_NAME).is(PluginConstants.PackageName.OPEN_AI_PLUGIN));
        Plugin openAiPlugin = mongoTemplate.findOne(pluginFindQuery, Plugin.class);
        if (openAiPlugin == null) {
            log.debug("OpenAI plugin not found while trying to update the documentation link");
            return;
        }
        openAiPlugin.setDocumentationLink("https://docs.appsmith.com/connect-data/reference/open-ai");
        mongoTemplate.save(openAiPlugin);
    }
}
