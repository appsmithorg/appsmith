package com.appsmith.external.plugins;

import com.appsmith.external.models.DatasourceConfiguration;
import java.util.Properties;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

public interface PluginExecutorConnectionParam<C, T> extends PluginExecutor<C> {
    default Mono<C> datasourceCreate(DatasourceConfiguration datasourceConfiguration, T connectionProperties) {
        return Mono.fromCallable(() -> addAuthParamsToConnectionConfig(datasourceConfiguration, connectionProperties))
                .map(properties1 -> addPluginSpecificProperties(datasourceConfiguration, properties1))
                .flatMap(properties1 -> createConnectionClient(datasourceConfiguration, properties1))
                .onErrorResume(error -> {
                    // We always expect to have an error object, but the error object may not be well-formed
                    final String errorMessage = error.getMessage();
                    throw new RuntimeException(errorMessage);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    default Mono<C> createConnectionClient(DatasourceConfiguration datasourceConfiguration, T connectionProperties) {
        return this.datasourceCreate(datasourceConfiguration);
    }

    default T addPluginSpecificProperties(DatasourceConfiguration datasourceConfiguration, T connectionProperties) {
        return connectionProperties;
    }

    default T addAuthParamsToConnectionConfig(DatasourceConfiguration datasourceConfiguration, T connectionProperties) {
        return connectionProperties;
    }
}
