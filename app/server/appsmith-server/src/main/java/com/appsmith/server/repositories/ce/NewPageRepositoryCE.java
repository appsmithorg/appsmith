package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewPageRepository;

import java.util.List;
import java.util.Optional;

public interface NewPageRepositoryCE extends BaseRepository<NewPage, String>, CustomNewPageRepository {

    List<NewPage> findByApplicationId(String applicationId, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(, EntityManager entityManager);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds, EntityManager entityManager);
}
