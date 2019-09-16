package com.appsmith.external.plugins;

import com.appsmith.external.models.CommandParams;
import org.pf4j.ExtensionPoint;
import reactor.core.publisher.Flux;

public interface PluginExecutor extends ExtensionPoint {

    Flux<Object> execute(String command, CommandParams params);
}
