package com.appsmith.server.migrations.db;

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
@ChangeUnit(order = "042-ee-01", id = "add-workflow-plugin")
public class Migration042EE01AddWorkflowPlugin {
    private final MongoTemplate mongoTemplate;

    public Migration042EE01AddWorkflowPlugin(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPluginToDbAndWorkspace() {
        Plugin plugin = new Plugin();
        plugin.setName(PluginConstants.PluginName.WORKFLOW_PLUGIN_NAME);
        plugin.setType(PluginType.INTERNAL);
        plugin.setPluginName(PluginConstants.PluginName.WORKFLOW_PLUGIN_NAME);
        plugin.setPackageName(PluginConstants.PackageName.WORKFLOW_PLUGIN);
        plugin.setUiComponent("UQIDbEditorForm");
        plugin.setDatasourceComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://assets.appsmith.com/workflows.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/connect-data/reference/workflows");
        plugin.setDefaultInstall(true);
        plugin.setRequiresAppsmithUserContext(Boolean.TRUE);
        plugin.setRequiresDatasource(Boolean.FALSE);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        if (plugin.getId() == null) {
            log.error("Failed to insert the Workflow plugin into the database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }
}
