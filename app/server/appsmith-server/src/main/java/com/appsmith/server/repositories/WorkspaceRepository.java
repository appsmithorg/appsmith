package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.WorkspaceRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceRepository extends WorkspaceRepositoryCE, CustomWorkspaceRepository {}
