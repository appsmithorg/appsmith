package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CrudModuleInstanceServiceImpl extends BaseModuleInstanceServiceImpl implements CrudModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;
    private final ModuleInstancePermission moduleInstancePermission;

    public CrudModuleInstanceServiceImpl(
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

    @Override
    public Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission) {
        if (!StringUtils.hasLength(branchName)) {
            return moduleInstanceRepository
                    .findById(defaultModuleInstanceId, permission)
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE, defaultModuleInstanceId)));
        }
        return moduleInstanceRepository
                .findByBranchNameAndDefaultModuleInstanceId(branchName, defaultModuleInstanceId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.MODULE_INSTANCE,
                        defaultModuleInstanceId + "," + branchName)));
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId, CreatorContextType contextType, String moduleInstanceId, AclPermission permission) {
        return moduleInstanceRepository
                .findAllUnpublishedComposedModuleInstancesByContextIdAndContextTypeAndModuleInstanceId(
                        contextId, contextType, moduleInstanceId, permission);
    }
}
