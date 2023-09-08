package com.appsmith.server.knowledgebase.services;

import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.dtos.KnowledgeStoreUpstreamDTO;
import reactor.core.publisher.Mono;

public interface KnowledgeStoreServiceCECompatible {

    Mono<KnowledgeStoreUpstreamDTO> generateDraftKB(String applicationId, Boolean isPublished);

    Mono<KnowledgeStore> generateDraftKB(String applicationId);

    Mono<KnowledgeStoreUpstreamDTO> getKnowledgeStore(String applicationId, Boolean isPublished);

    Mono<KnowledgeStore> getKnowledgeStore(String applicationId);
}
