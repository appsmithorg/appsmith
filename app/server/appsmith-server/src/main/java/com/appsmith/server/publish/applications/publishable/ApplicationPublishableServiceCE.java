package com.appsmith.server.publish.applications.publishable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ApplicationPublishingMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationPublishableServiceCE<T extends BaseDomain> {
    Mono<List<T>> publishEntities(ApplicationPublishingMetaDTO applicationPublishingMetaDTO);
}
