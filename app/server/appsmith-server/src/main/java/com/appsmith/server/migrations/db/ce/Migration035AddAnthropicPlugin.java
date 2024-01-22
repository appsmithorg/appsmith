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
@ChangeUnit(order = "035", id = "add-anthropic-plugin", author = " ")
public class Migration035AddAnthropicPlugin {
    private final MongoTemplate mongoTemplate;

    public Migration035AddAnthropicPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPluginToDbAndWorkspace() {
        Plugin plugin = new Plugin();
        plugin.setName(PluginConstants.PluginName.ANTHROPIC_PLUGIN_NAME);
        plugin.setType(PluginType.AI);
        plugin.setPluginName(PluginConstants.PluginName.ANTHROPIC_PLUGIN_NAME);
        plugin.setPackageName(PluginConstants.PackageName.ANTHROPIC_PLUGIN);
        plugin.setUiComponent("UQIDbEditorForm");
        plugin.setDatasourceComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://assets.appsmith.com/logo/anthropic.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/connect-data/reference/anthropic");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        assert plugin.getId() != null;

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }
}
