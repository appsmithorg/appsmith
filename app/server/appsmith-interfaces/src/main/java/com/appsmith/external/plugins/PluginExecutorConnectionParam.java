package com.appsmith.external.plugins;

import com.appsmith.external.models.DatasourceConfiguration;
import java.util.Properties;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * This is an intermediate interface in the hierarchy of pluginExecutor interface and its implementations.
 *
 * This is introduced to keep a subset of implementations keep working with the original mechanism while SQL based
 * plugins to be moved to use template method pattern for datasourceCreate method.
 *
 * Once all implementations are moved to template method pattern, the template method defined in this interface can
 * be moved to pluginExecutor interface and this interface can be removed
 *
 * This interface is added temporarily to refactor classes in phases. Reference diagram
 * <a href="file:../resources/template_pattern_createDatasource.png">template_pattern_createDatasource.png</a>
 *
 * @param <C> datasource generic type
 * @param <T> connection properties generic type
 */
public interface PluginExecutorConnectionParam<C, T> extends PluginExecutor<C> {
    default Mono<C> datasourceCreate(DatasourceConfiguration datasourceConfiguration, T connectionProperties) {
        return Mono.fromCallable(() -> addAuthParamsToConnectionConfig(datasourceConfiguration, connectionProperties))
                .map(properties1 -> addPluginSpecificProperties(datasourceConfiguration, properties1))
                .flatMap(properties1 -> createConnectionClient(datasourceConfiguration, properties1))
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
