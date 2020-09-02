package com.appsmith.server.helpers;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class PluginExecutorHelper {

    private final PluginManager pluginManager;

    @Autowired
    public PluginExecutorHelper(PluginManager pluginManager) {
        this.pluginManager = pluginManager;
    }

    public Mono<PluginExecutor> getPluginExecutor(Mono<Plugin> pluginMono) {
        return pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getPackageName());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getPackageName()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );
    }
}
