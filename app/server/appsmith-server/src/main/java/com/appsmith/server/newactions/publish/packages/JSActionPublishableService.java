package com.appsmith.server.newactions.publish.packages;

import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface JSActionPublishableService {
    Mono<Map<String, List<String>>> createPublishableJSActions(
            PackagePublishingMetaDTO publishingMetaDTO,
            List<String> sourceCollectionIds,
            Map<String, String> oldToNewCollectionIdMap);
}
