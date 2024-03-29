package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomWorkspaceRepository;
import reactor.core.publisher.Mono;

public interface WorkspaceRepositoryCE extends BaseRepository<Workspace, String>, CustomWorkspaceRepository {

    Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId);

    Mono<Workspace> findByName(String name);

    Mono<Long> countByDeletedAtNull();
}
