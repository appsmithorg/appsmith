package com.appsmith.server.fork.internal;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationForkingServiceCE {

    Mono<List<String>> forkApplications(String toWorkspaceId, Application application, String sourceEnvironmentId);

    Mono<Application> forkApplicationToWorkspaceWithEnvironment(
            String srcApplicationId, String targetWorkspaceId, String sourceEnvironmentId);

    Mono<ApplicationImportDTO> forkApplicationToWorkspace(String branchedSourceApplicationId, String targetWorkspaceId);
}
