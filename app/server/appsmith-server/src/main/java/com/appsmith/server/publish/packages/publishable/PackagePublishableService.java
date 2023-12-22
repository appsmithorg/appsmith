package com.appsmith.server.publish.packages.publishable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.PublishingMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface PackagePublishableService<T extends BaseDomain> {
    Mono<List<T>> getPublishableEntities(PublishingMetaDTO publishingMetaDTO);

    Mono<Void> updatePublishableEntities(PublishingMetaDTO publishingMetaDTO);
}
