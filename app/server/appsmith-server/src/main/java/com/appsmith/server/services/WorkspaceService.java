package com.appsmith.server.services;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ce.WorkspaceServiceCE;

import reactor.core.publisher.Mono;

public interface WorkspaceService extends WorkspaceServiceCE {

    Mono<Workspace> retrieveById(String workspaceId);

}
