package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.Set;

public interface CustomApplicationRepository extends CustomApplicationRepositoryCE {

    Flux<Application> findDefaultApplicationsByWorkspaceIds(Set<String> workspaceIds);

}
