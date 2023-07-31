package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;
import java.util.Set;

import static com.appsmith.external.constants.PluginConstants.PackageName.AMAZON_S3_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.DYNAMO_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.FIRESTORE_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.GOOGLE_SHEETS_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.RAPID_API_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REDSHIFT_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.SAAS_PLUGIN;

@ChangeUnit(order = "007", id = "opt-out-unsupported-plugins-airgap-instance", author = " ")
public class Migration007OptOutUnsupportedPluginsForAirGap {

    private final MongoTemplate mongoTemplate;

    public Migration007OptOutUnsupportedPluginsForAirGap(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void optOutUnsupportedPluginsForAirGapInstance() {
        // By default, all the plugins will be supported in air-gap instance.
        // One can opt out the support for plugin by adding `isSupportedForAirGap:false` in DB object.
        // Generally SaaS plugins and DBs which can't be self-hosted can be a candidate for opting out of air-gap as
        // these are dependent on external internet
        final Set<String> unsupportedPluginPackageNameInAirgap = Set.of(
                SAAS_PLUGIN,
                RAPID_API_PLUGIN,
                FIRESTORE_PLUGIN,
                REDSHIFT_PLUGIN,
                DYNAMO_PLUGIN,
                AMAZON_S3_PLUGIN,
                GOOGLE_SHEETS_PLUGIN);

        final Set<PluginType> cloudServicesDependentPluginTypes = Set.of(PluginType.SAAS, PluginType.REMOTE);

        List<Plugin> plugins = mongoTemplate.findAll(Plugin.class);
        for (Plugin plugin : plugins) {
            if (unsupportedPluginPackageNameInAirgap.contains(plugin.getPackageName())
                    || cloudServicesDependentPluginTypes.contains(plugin.getType())) {

                if (unsupportedPluginPackageNameInAirgap.contains(plugin.getPackageName())) {
                    plugin.setSupportedForAirGap(false);
                }
                if (cloudServicesDependentPluginTypes.contains(plugin.getType())) {
                    plugin.setIsDependentOnCS(true);
                }
                mongoTemplate.save(plugin);
            }
        }
    }
}
