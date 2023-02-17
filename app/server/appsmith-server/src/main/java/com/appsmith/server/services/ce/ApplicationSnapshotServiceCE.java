package com.appsmith.server.services.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import reactor.core.publisher.Mono;

public interface ApplicationSnapshotServiceCE {

    Mono<ApplicationSnapshot> createSnapshotForApplication(String applicationId, ApplicationJson applicationJson);
}
