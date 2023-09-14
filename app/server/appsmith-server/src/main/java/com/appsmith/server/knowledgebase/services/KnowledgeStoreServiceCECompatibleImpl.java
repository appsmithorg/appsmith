package com.appsmith.server.knowledgebase.services;

import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.dtos.KnowledgeStoreUpstreamDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class KnowledgeStoreServiceCECompatibleImpl implements KnowledgeStoreServiceCECompatible {

    public KnowledgeStoreServiceCECompatibleImpl() {}

    @Override
    public Mono<KnowledgeStore> generateDraftKB(String applicationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
    }

    @Override
    public Mono<KnowledgeStore> getKnowledgeStore(String applicationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
    }

    @Override
    public Mono<KnowledgeStoreUpstreamDTO> generateDraftKB(String applicationId, Boolean isPublished) {
        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
    }

    @Override
    public Mono<KnowledgeStoreUpstreamDTO> getKnowledgeStore(String applicationId, Boolean isPublished) {
        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
    }
}
