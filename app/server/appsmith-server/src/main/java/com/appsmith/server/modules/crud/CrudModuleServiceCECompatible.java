package com.appsmith.server.modules.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.base.BaseModuleServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.Set;

public interface CrudModuleServiceCECompatible extends BaseModuleServiceCECompatible {
    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

    Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId);

    Flux<String> findPackageIdsByModuleIds(Set<String> ids, Optional<AclPermission> permission);

    Flux<Module> findExportableModuleDataByIds(Set<String> moduleIdsSet, Optional<AclPermission> permissionOptional);

    Mono<ModuleDTO> getConsumableModuleByPackageIdAndOriginModuleId(String packageId, String originModuleId);
}
