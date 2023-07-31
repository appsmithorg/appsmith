package com.appsmith.server.services;

import com.appsmith.server.dtos.PluginDTO;
import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.services.ce.PluginServiceCE;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PluginService extends PluginServiceCE {
    Mono<Void> installRemotePlugin(RemotePluginWorkspaceDTO plugin);

    Mono<List<PluginDTO>> getAllPluginIconLocation();

    Mono<PluginDTO> getPluginIconLocation(String pluginId);

    /**
     * This method checks whether the given plugin is in scope for implementation in multiple datasource environments
     * This is driven by a constant list of plugins, that is controlled by the service itself
     *
     * @param pluginId
     * @return
     */
    Mono<Boolean> isOosPluginForME(String pluginId);
}
