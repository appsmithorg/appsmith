package com.appsmith.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import org.pf4j.ExtensionPoint;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface PluginExecutor<C> extends ExtensionPoint {

    /**
     * This function is used to execute the action.
     *
     * @param connection              : This is the connection that is established to the data source. This connection is according
     *                                to the parameters in Datasource Configuration
     * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
     * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
     * @return ActionExecutionResult : This object is returned to the user which contains the result values from the execution.
     */
    Mono<ActionExecutionResult> execute(C connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration);

    /**
     * This function is responsible for creating the connection to the data source and returning the connection variable
     * on success. For executing actions, this connection object would be passed for each function call.
     *
     * @param datasourceConfiguration
     * @return Connection object
     */
    Mono<C> datasourceCreate(DatasourceConfiguration datasourceConfiguration);

    /**
     * This function is used to bring down/destroy the connection to the data source.
     *
     * @param connection
     */
    void datasourceDestroy(C connection);

    default boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
        return CollectionUtils.isEmpty(validateDatasource(datasourceConfiguration));
    }

    Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration);

    Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration);

    default Mono<DatasourceStructure> getStructure(C connection, DatasourceConfiguration datasourceConfiguration) {
        return Mono.empty();
    }

}
