package com.appsmith.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import org.pf4j.ExtensionPoint;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PluginExecutor extends ExtensionPoint {

    /**
     * This function is used to execute the action. 
     * @param connection : This is the connection that is established to the data source. This connection is according
     *                   to the parameters in Resource Configuration
     * @param resourceConfiguration : These are the configurations which have been used to create a Resource from a Plugin
     * @param actionConfiguration : These are the configurations which have been used to create an Action from a Resource.
     * @return ActionExecutionResult : This object is returned to the user which contains the result values from the execution.
     */
    Mono<ActionExecutionResult> execute(Object connection, ResourceConfiguration resourceConfiguration, ActionConfiguration actionConfiguration);

    /**
     * This function is responsible for creating the connection to the data source and returning the connection variable
     * on success. For executing actions, this connection object would be passed for each function call.
     * @param resourceConfiguration
     * @return Connection object
     */
    Object resourceCreate(ResourceConfiguration resourceConfiguration);

    /**
     * This function is used to bring down/destroy the connection to the data source.
     * @param connection
     */
    void resourceDestroy(Object connection);
}
