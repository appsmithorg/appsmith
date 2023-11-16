package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CurdModuleInstanceServiceImpl extends BaseModuleInstanceServiceImpl implements CrudModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;
    private final ModuleInstancePermission moduleInstancePermission;

    public CurdModuleInstanceServiceImpl(
            ModuleInstanceRepository moduleInstanceRepository, ModuleInstancePermission moduleInstancePermission) {
        super(moduleInstanceRepository);
        this.moduleInstanceRepository = moduleInstanceRepository;
        this.moduleInstancePermission = moduleInstancePermission;
    }

    @Override
    public Mono<ModuleInstanceDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO) {
        return null;
    }

    @Override
    public Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode) {
        return moduleInstanceRepository
                .findAllByContextIdAndContextType(contextId, contextType, moduleInstancePermission.getReadPermission())
                .flatMap(moduleInstanceRepository::setUserPermissionsInObject)
                .flatMap(moduleInstance -> generateModuleInstanceByViewMode(moduleInstance, resourceMode))
                .collectList();
    }

    @Override
    public Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId) {
        return null;
    }

    @Override
    public Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName) {
        return null;
    }
}
