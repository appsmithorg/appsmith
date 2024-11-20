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

    Optional<Application> findByName(String name, EntityManager entityManager);

    List<Application> findByIdIn(List<String> ids, EntityManager entityManager);

    List<Application> findByWorkspaceId(String workspaceId, EntityManager entityManager);

    Optional<Long> countByWorkspaceId(String workspaceId, EntityManager entityManager);

    List<IdOnly> findIdsByWorkspaceId(String workspaceId, EntityManager entityManager);

    List<Application> findByClonedFromApplicationId(String clonedFromApplicationId, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(, EntityManager entityManager);

    Optional<Application> findByIdAndExportWithConfiguration(String id, boolean exportWithConfiguration, EntityManager entityManager);
}
