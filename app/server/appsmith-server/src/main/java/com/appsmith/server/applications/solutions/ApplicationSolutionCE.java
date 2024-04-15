package com.appsmith.server.applications.solutions;

import reactor.core.publisher.Mono;

public interface ApplicationSolutionCE {

    Mono<Void> archiveApplicationAndItsComponents(String applicationId);
}
