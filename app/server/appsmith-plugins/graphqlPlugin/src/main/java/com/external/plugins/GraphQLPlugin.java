package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.connections.APIConnection;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;
import java.util.Set;

public class GraphQLPlugin extends BasePlugin {

    public GraphQLPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor<APIConnection>, SmartSubstitutionInterface {

        @Override
        public Mono<ActionExecutionResult> execute(APIConnection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public void datasourceDestroy(APIConnection connection) {

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
