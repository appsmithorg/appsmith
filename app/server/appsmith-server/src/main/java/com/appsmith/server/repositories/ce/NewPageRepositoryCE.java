package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewPageRepository;

import java.util.List;

public interface NewPageRepositoryCE extends BaseRepository<NewPage, String>, CustomNewPageRepository {

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);
}
