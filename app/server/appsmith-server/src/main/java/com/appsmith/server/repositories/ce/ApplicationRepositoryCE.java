package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApplicationRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepositoryCE extends BaseRepository<Application, String>, CustomApplicationRepository {
    // All methods moved to CustomApplicationRepositoryCE
    List<IdOnly> findIdsByWorkspaceId(String workspaceId);
}
