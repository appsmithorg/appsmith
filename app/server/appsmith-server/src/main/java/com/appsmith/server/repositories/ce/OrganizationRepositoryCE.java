package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomOrganizationRepository;
import reactor.core.publisher.Mono;

public interface OrganizationRepositoryCE extends BaseRepository<Workspace, String>, CustomOrganizationRepository {

    Mono<Workspace> findBySlug(String slug);

    Mono<Workspace> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Mono<Workspace> findByName(String name);

    Mono<Void> updateUserRoleNames(String userId, String userName);

    Mono<Long> countByDeletedAtNull();

}
