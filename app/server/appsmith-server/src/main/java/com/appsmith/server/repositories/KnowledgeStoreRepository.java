package com.appsmith.server.repositories;

import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.repositories.ce_compatible.KnowledgeStoreRepositoryCECompatible;
import reactor.core.publisher.Mono;

public interface KnowledgeStoreRepository extends KnowledgeStoreRepositoryCECompatible {
    Mono<KnowledgeStore> findById(String id);

    Mono<KnowledgeStore> findByApplicationId(String applicationId);
}
