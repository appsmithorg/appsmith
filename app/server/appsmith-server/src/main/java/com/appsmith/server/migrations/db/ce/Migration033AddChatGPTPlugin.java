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
@ChangeUnit(order = "033", id = "add-chat-gpt-plugin-", author = " ")
public class Migration033AddChatGPTPlugin {

    private final MongoTemplate mongoTemplate;

    public Migration033AddChatGPTPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPluginToDbAndWorkspace() {
        Plugin plugin = new Plugin();
        plugin.setName(PluginConstants.PluginName.CHAT_GPT_PLUGIN_NAME);
        plugin.setType(PluginType.API);
        plugin.setPackageName(PluginConstants.PackageName.CHAT_GPT_PLUGIN);
        plugin.setUiComponent("ApiEditorForm");
        plugin.setDatasourceComponent("RestAPIDatasourceForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }
}
