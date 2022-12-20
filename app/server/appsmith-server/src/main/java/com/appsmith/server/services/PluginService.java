package com.appsmith.server.services;

import com.appsmith.server.dtos.PluginDTO;
import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.services.ce.PluginServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PluginService extends PluginServiceCE {
    Mono<Void> installRemotePlugin(RemotePluginWorkspaceDTO plugin);

    Mono<List<PluginDTO>> getAllPluginIconLocation();

    Mono<PluginDTO> getPluginIconLocation(String pluginId);
}
