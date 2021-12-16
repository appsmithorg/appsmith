package com.appsmith.server.services;

import com.appsmith.server.dtos.RemotePluginOrgDTO;
import com.appsmith.server.services.ce.PluginServiceCE;
import reactor.core.publisher.Mono;

public interface PluginService extends PluginServiceCE {
    Mono<Void> installRemotePlugin(RemotePluginOrgDTO plugin);
}
