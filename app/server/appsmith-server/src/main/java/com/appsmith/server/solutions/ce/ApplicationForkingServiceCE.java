package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface ApplicationForkingServiceCE {

    Mono<Application> forkApplicationToWorkspace(String srcApplicationId, String targetWorkspaceId);

    Mono<Application> forkApplicationToWorkspace(String srcApplicationId,
                                                    String targetWorkspaceId,
                                                    String branchName);

}
