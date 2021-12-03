package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

import java.util.Set;

public class JSPlugin extends BasePlugin {

    public JSPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class JSPluginExecutor implements PluginExecutor<Void>, SmartSubstitutionInterface {
        @Override
        public Mono<ActionExecutionResult> execute(Void connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return Mono.empty();
        }

        @Override
        public Mono<Void> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Void connection) {
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Set.of();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }
    }

}