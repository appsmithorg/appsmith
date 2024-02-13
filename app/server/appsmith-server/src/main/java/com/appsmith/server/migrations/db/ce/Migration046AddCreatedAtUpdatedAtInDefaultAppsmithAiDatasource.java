package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.util.stream.Stream;

import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.server.constants.ce.FieldNameCE.PACKAGE_NAME;

@Slf4j
@ChangeUnit(order = "046", id = "add-created-at-updated-at-default-appsmith-datasource", author = "")
public class Migration046AddCreatedAtUpdatedAtInDefaultAppsmithAiDatasource {
    private final MongoTemplate mongoTemplate;

    public Migration046AddCreatedAtUpdatedAtInDefaultAppsmithAiDatasource(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addCreatedAtUpdatedAtInDefaultAppsmithAiDatasource() {
        // find Appsmith AI plugin id and then find existing Appsmith AI datasource without createdAt
        Query pluginQuery = new Query();
        pluginQuery.addCriteria(Criteria.where(PACKAGE_NAME).is(APPSMITH_AI_PLUGIN));
        Plugin plugin = mongoTemplate.findOne(pluginQuery, Plugin.class);
        if (plugin == null) {
            log.error("Appsmith AI plugin not found");
            return;
        }
        String pluginId = plugin.getId();

        Query datasourceQuery = new Query();
        datasourceQuery.addCriteria(Criteria.where(FieldNameCE.PLUGIN_ID)
                .is(pluginId)
                .and(FieldNameCE.CREATED_AT)
                .exists(false));

        try (Stream<Datasource> datasourceStream = mongoTemplate.stream(datasourceQuery, Datasource.class)) {
            datasourceStream.forEach(datasource -> {
                datasource.setCreatedAt(Instant.now());
                datasource.setUpdatedAt(Instant.now());
                mongoTemplate.save(datasource);
            });
        } catch (Exception e) {
            log.error("Error during processing migration add-created-at-updated-at-default-appsmith-datasource", e);
        }
    }
}
