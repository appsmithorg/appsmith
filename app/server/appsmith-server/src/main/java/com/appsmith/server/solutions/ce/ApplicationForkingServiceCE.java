package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface ApplicationForkingServiceCE {

    Mono<Application> forkApplicationToOrganization(String srcApplicationId, String targetOrganizationId);

}
