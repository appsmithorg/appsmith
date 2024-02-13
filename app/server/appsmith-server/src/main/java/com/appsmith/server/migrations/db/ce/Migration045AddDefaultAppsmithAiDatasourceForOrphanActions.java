package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static com.appsmith.external.constants.PluginConstants.DEFAULT_APPSMITH_AI_DATASOURCE;
import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.server.constants.ce.FieldNameCE.PACKAGE_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.PLUGIN_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;

/**
 * Initially we rolled-out Appsmith AI as an embedded plugin where Appsmith AI actions were created without a datasource creation.
 * Now those actions needs to be associated with a datasource.
 */
@Slf4j
@ChangeUnit(order = "045", id = "add-default-appsmith-datasource", author = "")
public class Migration045AddDefaultAppsmithAiDatasourceForOrphanActions {
    private final MongoTemplate mongoTemplate;

    public Migration045AddDefaultAppsmithAiDatasourceForOrphanActions(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * Find all orphan actions by checking name of datasource associated as `DEFAULT_APPSMITH_AI_DATASOURCE` and
     * associate them with a new Appsmith AI datasource if no existing Appsmith AI datasource created.
     */
    @Execution
    public void addDefaultAppsmithAiDatasourceForOrphanActions() {
        // find Appsmith AI plugin id and then find if any existing Appsmith AI datasource
        Query pluginQuery = new Query();
        pluginQuery.addCriteria(Criteria.where(PACKAGE_NAME).is(APPSMITH_AI_PLUGIN));
        Plugin plugin = mongoTemplate.findOne(pluginQuery, Plugin.class);
        if (plugin == null) {
            log.error("Appsmith AI plugin not found");
            return;
        }
        String pluginId = plugin.getId();

        Query query = new Query();
        query.addCriteria(Criteria.where("unpublishedAction.datasource.name").is(DEFAULT_APPSMITH_AI_DATASOURCE));
        Map<String, Datasource> workspaceToDatasourceMap = new HashMap<>();

        // for each action, find the workspace id and check if there is a datasource associated with it
        // if yes, then associate the action with that datasource
        // if no, then create a new datasource and associate the action with that datasource
        try (Stream<NewAction> newActionsStream = mongoTemplate.stream(query, NewAction.class)) {
            newActionsStream.forEach(newAction -> {
                String workspaceId = newAction.getWorkspaceId();
                if (workspaceToDatasourceMap.containsKey(workspaceId)) {
                    newAction.getUnpublishedAction().setDatasource(workspaceToDatasourceMap.get(workspaceId));
                    newAction.getPublishedAction().setDatasource(workspaceToDatasourceMap.get(workspaceId));
                    mongoTemplate.save(newAction);
                } else {
                    Query datasourceQuery = new Query();
                    datasourceQuery.addCriteria(Criteria.where(PLUGIN_ID).is(pluginId));
                    datasourceQuery.addCriteria(Criteria.where(WORKSPACE_ID).is(workspaceId));
                    Datasource datasource = mongoTemplate.findOne(datasourceQuery, Datasource.class);
                    if (datasource == null) {
                        datasource = new Datasource();
                        datasource.setName(DEFAULT_APPSMITH_AI_DATASOURCE);
                        datasource.setPluginId(pluginId);
                        datasource.setWorkspaceId(workspaceId);
                        datasource = mongoTemplate.insert(datasource);
                    }
                    workspaceToDatasourceMap.put(workspaceId, datasource);
                    newAction.getUnpublishedAction().setDatasource(datasource);
                    newAction.getPublishedAction().setDatasource(datasource);
                    mongoTemplate.save(newAction);
                }
            });
        } catch (Exception e) {
            log.error("Error processing Appsmith AI actions during migration", e);
        }
    }
}
