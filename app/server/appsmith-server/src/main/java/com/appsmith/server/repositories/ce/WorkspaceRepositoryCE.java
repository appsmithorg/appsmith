package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomWorkspaceRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface WorkspaceRepositoryCE extends BaseRepository<Workspace, String>, CustomWorkspaceRepository {

    // TODO(Shri): Native queries are debt. Fix DB model to avoid this.
    @Query(
            value = "SELECT * FROM workspace "
                    + "WHERE id = ? "
                    + "AND jsonb_path_exists(plugins, '$[*].pluginId ? (@ == $p)',  jsonb_build_object('p', ?))",
            nativeQuery = true)
    Optional<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId, EntityManager entityManager);

    Optional<Workspace> findByName(String name, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(, EntityManager entityManager);
}
