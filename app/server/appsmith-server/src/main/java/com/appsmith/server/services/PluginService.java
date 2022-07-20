package com.appsmith.server.services;

import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.services.ce.PluginServiceCE;
import reactor.core.publisher.Mono;

public interface PluginService extends PluginServiceCE {
    Mono<Void> installRemotePlugin(RemotePluginWorkspaceDTO plugin);
}
