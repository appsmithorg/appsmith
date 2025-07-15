package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.migrations.DatabaseChangelog1.installPluginToAllWorkspaces;

@Slf4j
@ChangeUnit(order = "074", id = "add-deepseek-ai-plugin", author = " ")
public class Migration074AddDeepseekAIPlugin {

    private final MongoTemplate mongoTemplate;

    public Migration074AddDeepseekAIPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPluginToDbAndWorkspace() {
        // 添加 DeepSeek AI 插件                  
        Plugin plugin = new Plugin();
        plugin.setName(PluginConstants.PluginName.DEEPSEEK_AI_PLUGIN_NAME);
        plugin.setType(PluginType.AI);
        plugin.setPluginName(PluginConstants.PluginName.DEEPSEEK_AI_PLUGIN_NAME);
        plugin.setPackageName(PluginConstants.PackageName.OPEN_AI_PLUGIN);
        plugin.setUiComponent("UQIDbEditorForm");
        plugin.setDatasourceComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("assets/deepseek-ai-icon.png");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/deepseek-ai");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }
}
