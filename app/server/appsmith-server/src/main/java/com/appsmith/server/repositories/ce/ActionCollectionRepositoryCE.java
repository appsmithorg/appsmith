package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionCollectionRepository;

import java.util.List;

public interface ActionCollectionRepositoryCE
        extends BaseRepository<ActionCollection, String>, CustomActionCollectionRepository {

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);
}
