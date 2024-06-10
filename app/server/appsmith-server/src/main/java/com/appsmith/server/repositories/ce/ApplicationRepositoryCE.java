package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApplicationRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepositoryCE extends BaseRepository<Application, String>, CustomApplicationRepository {

    Optional<Application> findByName(String name);

    List<Application> findByIdIn(List<String> ids);

    List<Application> findByWorkspaceId(String workspaceId);

    Optional<Long> countByWorkspaceId(String workspaceId);

    List<IdOnly> findIdsByWorkspaceId(String workspaceId);

    List<Application> findByClonedFromApplicationId(String clonedFromApplicationId);

    Optional<Long> countByDeletedAtNull();

    Optional<Application> findByIdAndExportWithConfiguration(String id, boolean exportWithConfiguration);
}
