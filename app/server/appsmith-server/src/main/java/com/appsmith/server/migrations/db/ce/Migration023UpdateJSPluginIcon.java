package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

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

        query.fields().include(Plugin.Fields.iconLocation);
        List<Plugin> plugins = mongoTemplate.find(query, Plugin.class);
        for (final Plugin plugin : plugins) {
            if (plugin.getIconLocation() != null) {
                final String updatedJSIconUrl = plugin.getIconLocation().replace("JSFile.svg", "js-yellow.svg");
                mongoTemplate.updateFirst(
                        query(where(Plugin.Fields.id).is(plugin.getId())),
                        update(Plugin.Fields.iconLocation, updatedJSIconUrl),
                        Plugin.class);
            }
        }
    }
}
