package com.appsmith.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.CommandParams;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import org.pf4j.ExtensionPoint;
import reactor.core.publisher.Flux;

import java.util.List;

public interface PluginExecutor extends ExtensionPoint {

    Flux<Object> execute(ResourceConfiguration resourceConfiguration, ActionConfiguration action, List<Param> params);
}
