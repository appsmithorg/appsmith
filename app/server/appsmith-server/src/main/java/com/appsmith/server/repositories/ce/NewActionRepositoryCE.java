package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.newactions.projections.IdAndDatasourceIdNewActionView;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewActionRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NewActionRepositoryCE extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    @Query(value = "SELECT a FROM NewAction a WHERE a.applicationId = :applicationId AND a.deletedAt IS NULL")
    List<NewAction> findByApplicationId(String applicationId, EntityManager entityManager);

    List<NewAction> findAllByIdIn(Collection<String> ids, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(, EntityManager entityManager);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds, EntityManager entityManager);

    List<IdAndDatasourceIdNewActionView> findIdAndDatasourceIdByApplicationIdIn(List<String> applicationIds, EntityManager entityManager);

    @Query(
            """
        SELECT new com.appsmith.server.dtos.PluginTypeAndCountDTO(a.pluginType, count(a)) as count
            FROM NewAction a
            WHERE a.applicationId = :applicationId AND a.deletedAt IS NULL
            GROUP BY a.pluginType
        """)
    List<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId, EntityManager entityManager);
}
