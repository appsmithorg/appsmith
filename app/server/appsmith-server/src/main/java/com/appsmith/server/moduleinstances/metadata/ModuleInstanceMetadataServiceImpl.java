package com.appsmith.server.moduleinstances.metadata;

import com.appsmith.server.repositories.ModuleInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ModuleInstanceMetadataServiceImpl implements ModuleInstanceMetadataService {
    private final ModuleInstanceRepository repository;

    @Override
    public Mono<Long> getModuleInstanceCountByApplicationId(String applicationId) {
        return repository.getModuleInstanceCountByApplicationId(applicationId, Optional.empty());
    }
}
