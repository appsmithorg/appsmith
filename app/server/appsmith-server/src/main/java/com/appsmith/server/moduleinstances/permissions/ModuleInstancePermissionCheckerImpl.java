package com.appsmith.server.moduleinstances.permissions;

import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ModuleInstancePermissionCheckerImpl implements ModuleInstancePermissionChecker {
    private final ModuleInstanceRepository moduleInstanceRepository;

    public ModuleInstancePermissionCheckerImpl(ModuleInstanceRepository moduleInstanceRepository) {
        this.moduleInstanceRepository = moduleInstanceRepository;
    }

    @Override
    public Mono<Long> getModuleInstanceCountByModuleUUID(String moduleUUID, String workspaceId) {
        return moduleInstanceRepository.getModuleInstanceCountByModuleUUID(moduleUUID, workspaceId);
    }
}
