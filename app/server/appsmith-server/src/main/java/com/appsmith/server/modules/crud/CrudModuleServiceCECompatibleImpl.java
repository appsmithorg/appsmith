package com.appsmith.server.modules.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.base.BaseModuleServiceImpl;
import com.appsmith.server.repositories.ModuleRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.Set;

@Service
public class CrudModuleServiceCECompatibleImpl extends BaseModuleServiceImpl implements CrudModuleServiceCECompatible {
    public CrudModuleServiceCECompatibleImpl(ModuleRepository moduleRepository) {
        super(moduleRepository);
    }

    @Override
    public Mono<ModuleDTO> createModule(ModuleDTO moduleDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<String> findPackageIdsByModuleIds(Set<String> ids, Optional<AclPermission> permission) {
        return Flux.empty();
    }

    @Override
    public Flux<Module> findExportableModuleDataByIds(
            Set<String> moduleIdsSet, Optional<AclPermission> permissionOptional) {
        return Flux.empty();
    }
}
