package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.newactions.projections.IdAndDatasourceIdNewActionView;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewActionRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NewActionRepositoryCE extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    @Query(value = "SELECT a FROM NewAction a WHERE a.applicationId = :applicationId AND a.deletedAt IS NULL")
    List<NewAction> findByApplicationId(String applicationId);

    List<NewAction> findAllByIdIn(Collection<String> ids);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);

    List<IdAndDatasourceIdNewActionView> findIdAndDatasourceIdByApplicationIdIn(List<String> applicationIds);
}
