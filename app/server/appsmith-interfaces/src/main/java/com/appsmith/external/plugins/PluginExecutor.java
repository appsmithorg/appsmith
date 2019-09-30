package com.appsmith.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import org.pf4j.ExtensionPoint;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PluginExecutor extends ExtensionPoint {

    Mono<ActionExecutionResult> execute(ResourceConfiguration resourceConfiguration, ActionConfiguration action, List<Param> params);
}
