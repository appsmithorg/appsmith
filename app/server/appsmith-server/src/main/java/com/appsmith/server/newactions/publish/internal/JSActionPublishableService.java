package com.appsmith.server.newactions.publish.internal;

import com.appsmith.server.dtos.PublishingMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface JSActionPublishableService {
    Mono<Map<String, List<String>>> createPublishableJSActions(
            PublishingMetaDTO publishingMetaDTO,
            List<String> sourceCollectionIds,
            Map<String, String> oldToNewCollectionIdMap);
}
