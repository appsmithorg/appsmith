package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomWorkspaceRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface WorkspaceRepositoryCE extends BaseRepository<Workspace, String>, CustomWorkspaceRepository {

    Optional<Workspace> findBySlug(String slug);

    @Query("select w from Workspace w join w.plugins p where w.id = :workspaceId and p.id = :pluginId")
    Optional<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId);

    Optional<Workspace> findByName(String name);

    Optional<Long> countByDeletedAtNull();
}
