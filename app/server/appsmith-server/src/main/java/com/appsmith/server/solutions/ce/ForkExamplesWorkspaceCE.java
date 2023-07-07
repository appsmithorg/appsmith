package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ForkExamplesWorkspaceCE {

    Mono<Workspace> forkExamplesWorkspace();

    Mono<Workspace> forkWorkspaceForUser(
            String templateWorkspaceId, User user, Flux<Application> applicationFlux, Flux<Datasource> datasourceFlux);

    Mono<List<String>> forkApplications(
            String toWorkspaceId, Flux<Application> applicationFlux, String sourceEnvironmentId);

    Mono<List<String>> forkApplications(
            String toWorkspaceId,
            Flux<Application> applicationFlux,
            Flux<Datasource> datasourceFlux,
            String sourceEnvironmentId);
}
