package com.appsmith.server.moduleinstances.metadata;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ModuleInstanceMetadataServiceImpl implements ModuleInstanceMetadataService {
    private final ModuleInstanceRepository repository;

    @Override
    public Mono<Long> getModuleInstanceCountByApplicationId(String applicationId, AclPermission permission) {
        return repository.getModuleInstanceCountByApplicationId(applicationId, permission);
    }
}
