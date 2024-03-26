package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@RequiredArgsConstructor
@ChangeUnit(order = "023", id = "update-js-plugin-icon")
public class Migration023UpdateJSPluginIcon {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        Criteria jsFunctionsPlugin = where("name").is("JS Functions");
        final Query query = query((new Criteria()).andOperator(jsFunctionsPlugin));

        query.fields().include(fieldName(QPlugin.plugin.iconLocation));
        List<Plugin> plugins = mongoTemplate.find(query, Plugin.class);
        for (final Plugin plugin : plugins) {
            if (plugin.getIconLocation() != null) {
                final String updatedJSIconUrl = plugin.getIconLocation().replace("JSFile.svg", "js-yellow.svg");
                mongoTemplate.updateFirst(
                        query(where(fieldName(QPlugin.plugin.id)).is(plugin.getId())),
                        update(fieldName(QPlugin.plugin.iconLocation), updatedJSIconUrl),
                        Plugin.class);
            }
        }
    }
}
