package com.appsmith.server.publish.publishable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ApplicationPublishingMetaDTO;
import reactor.core.publisher.Mono;

public interface ApplicationPublishableService<T extends BaseDomain> {
    Mono<Void> publishEntities(ApplicationPublishingMetaDTO applicationPublishingMetaDTO);
}
