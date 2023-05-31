package com.appsmith.server.services;

import com.appsmith.external.models.Environment;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ce.WorkspaceServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface WorkspaceService extends WorkspaceServiceCE {

    Mono<Workspace> retrieveById(String workspaceId);

    Flux<Environment> getDefaultEnvironment(String workspaceId);
}
