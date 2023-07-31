package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Set;

import static com.appsmith.external.constants.PluginConstants.PackageName.AMAZON_S3_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.DYNAMO_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.FIRESTORE_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REDSHIFT_PLUGIN;

@ChangeUnit(order = "008", id = "support-non-self-hosted-plugins-for-airgap", author = " ")
public class Migration008SupportNonHostedPluginsForAirgap {
    private final MongoTemplate mongoTemplate;

    public Migration008SupportNonHostedPluginsForAirgap(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void supportNonHostedPluginsForAirgap() {
        // By default, all the plugins will be supported in air-gap instance.
        // In earlier PR we opted out for plugins which can't be self-hosted for airgap thinking that as public internet
        // is not available. But we are seeing multiple level of airgapping is needed where customers still want the
        // support for few plugins like S3, Redshift, Firestore etc. which are offered by hosting providers.
        final Set<String> supportedNonSelfHostedPluginPackageNameForAirgap =
                Set.of(FIRESTORE_PLUGIN, REDSHIFT_PLUGIN, DYNAMO_PLUGIN, AMAZON_S3_PLUGIN);

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);
        for (Plugin plugin : plugins) {
            if (supportedNonSelfHostedPluginPackageNameForAirgap.contains(plugin.getPackageName())) {
                Update update = new Update();
                update.unset(FieldName.IS_SUPPORTED_FOR_AIR_GAP);
                mongoTemplate.updateFirst(
                        new Query().addCriteria(Criteria.where(FieldName.ID).is(plugin.getId())), update, Plugin.class);
            }
        }
    }
}
