package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

import java.util.Set;


public class S3Plugin extends BasePlugin {

    public S3Plugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class S3PluginExecutor implements PluginExecutor<AmazonS3> {


        @Override
        public Mono<ActionExecutionResult> execute(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public void datasourceDestroy(AmazonS3 connection) {

        }

        @Override
        public boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            return false;
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}