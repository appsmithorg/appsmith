package com.appsmith.server.knowledgebase.services;

import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.dtos.KnowledgeStoreDownstreamDTO;
import reactor.core.publisher.Mono;

public interface KnowledgeStoreService extends KnowledgeStoreServiceCECompatible {

    Mono<KnowledgeStore> create(KnowledgeStore knowledgeStore);

    Mono<KnowledgeStore> save(KnowledgeStore knowledgeStore);

    Mono<KnowledgeStore> findById(String id);

    Mono<KnowledgeStore> findByApplicationId(String applicationId);

    Mono<KnowledgeStore> obtainKnowledgeStoreFromDB(String applicationId);

    KnowledgeStore mergeKnowledgeStore(KnowledgeStore dbKnowledgeStore, KnowledgeStore csKnowledgeStore);

    Boolean verifyKnowledgeStoreFetchComplete(KnowledgeStore knowledgeStore);

    Mono<KnowledgeStore> addTransientsToKnowledgeStore(KnowledgeStore knowledgeStore);

    Mono<KnowledgeStoreDownstreamDTO> getKBGenerationStatusFromCloudServer(
            KnowledgeStoreDownstreamDTO knowledgeStoreDTO);

    Mono<KnowledgeStoreDownstreamDTO> sendKBGenerationRequestToCloudServer(
            KnowledgeStoreDownstreamDTO knowledgeStoreDTO);

    Mono<String> getApplicationJsonStringForApplicationId(String applicationId);

    Mono<KnowledgeStore> addDSLToKnowledgeStore(KnowledgeStore knowledgeStore);

    Mono<KnowledgeStoreDownstreamDTO> sendPurgeRequestToCloudServer(KnowledgeStoreDownstreamDTO knowledgeStoreDTO);
}
