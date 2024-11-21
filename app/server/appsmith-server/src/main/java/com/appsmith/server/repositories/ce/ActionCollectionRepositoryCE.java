package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionCollectionRepository;
import jakarta.persistence.EntityManager;

import java.util.List;

public interface ActionCollectionRepositoryCE
        extends BaseRepository<ActionCollection, String>, CustomActionCollectionRepository {
    List<ActionCollection> findByApplicationId(String applicationId, EntityManager entityManager);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds, EntityManager entityManager);
}
