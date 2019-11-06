package com.appsmith.server.services;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.domains.ResourceContext;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ResourceContextServiceImpl implements ResourceContextService {

    //This is ResourceID mapped to the ResourceContext
    Map<String, ResourceContext> resourceContextHashMap;
    private final ResourceService resourceService;
    private final PluginManager pluginManager;
    private final PluginService pluginService;

    @Autowired
    public ResourceContextServiceImpl(ResourceService resourceService, PluginManager pluginManager, PluginService pluginService) {
        this.resourceService = resourceService;
        this.pluginManager = pluginManager;
        this.pluginService = pluginService;
        this.resourceContextHashMap = new HashMap<>();
    }

    @Override
    public Mono<ResourceContext> getResourceContext(String resourceId) {
        if (resourceContextHashMap.get(resourceId) != null) {
            log.debug("resource context exists. Returning the same.");
            return Mono.just(resourceContextHashMap.get(resourceId));
        }
        log.debug("Resource context doesnt exist. Creating connection");

        Mono<Resource> resourceMono = resourceService
                                        .findById(resourceId);

        Mono<Plugin> pluginMono = resourceMono
                                    .flatMap(resource -> pluginService.findById(resource.getPluginId()));

        //Resource Context has not been created for this resource on this machine. Create one now.
        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        return Mono.zip(resourceMono, pluginExecutorMono, ((resource, pluginExecutor) -> {
                Object connection = pluginExecutor.resourceCreate(resource.getResourceConfiguration());
                ResourceContext resourceContext = new ResourceContext();
                resourceContext.setConnection(connection);

                resourceContextHashMap.put(resourceId, resourceContext);
                return resourceContext;
        }));
    }

    @Override
    public Mono<ResourceContext> deleteResourceContext(String resourceId) {

        ResourceContext resourceContext = resourceContextHashMap.get(resourceId);
        if (resourceContext == null) {
            //No resource context exists for this resource. Return void;
            return Mono.empty();
        }

        Mono<Resource> resourceMono = resourceService
                .findById(resourceId);

        Mono<Plugin> pluginMono = resourceMono
                .flatMap(resource -> pluginService.findById(resource.getPluginId()));

        //Resource Context has not been created for this resource on this machine. Create one now.
        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        return Mono.zip(resourceMono, pluginExecutorMono, ((resource, pluginExecutor) -> {
            pluginExecutor.resourceDestroy(resourceContext.getConnection());
            resourceContextHashMap.remove(resourceId);
            return resourceContext;
        }));
    }
}
