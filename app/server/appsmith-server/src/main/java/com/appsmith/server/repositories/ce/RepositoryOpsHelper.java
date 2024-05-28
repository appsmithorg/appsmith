package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;

public class RepositoryOpsHelper {
    private final EntityManager entityManager;

    public RepositoryOpsHelper(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    @Modifying
    public <T extends BaseDomain> void persist(T entityFromDB) {
        entityManager.persist(entityFromDB);
    }

    @Transactional
    @Modifying
    public <T extends BaseDomain> int updateExecute(CriteriaUpdate<T> criteriaUpdate) {
        return entityManager.createQuery(criteriaUpdate).executeUpdate();
    }
}
