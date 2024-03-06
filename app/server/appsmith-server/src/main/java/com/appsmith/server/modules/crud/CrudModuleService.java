package com.appsmith.server.modules.crud;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.base.BaseModuleService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleService extends BaseModuleService, CrudModuleServiceCECompatible {
    Mono<List<ModuleDTO>> getAllModuleDTOs(String packageId, ResourceModes resourceMode);

    Flux<Module> getAllModules(String packageId, AclPermission aclPermission);

    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

    Mono<ModuleDTO> getModule(String moduleId);

    void generateAndSetPolicies(Package aPackage, Module module);

    Mono<ModuleDTO> updateModule(String moduleId, ModuleDTO moduleResource);

    Mono<ModuleDTO> deleteModule(String moduleId);

    Flux<Module> saveModuleInBulk(List<Module> modules);

    Mono<Void> archiveModulesByPackageId(String packageId);

    Mono<List<ModuleDTO>> getAllConsumableModules(List<String> packageIds);

    Mono<ModuleDTO> findByIdAndLayoutsId(
            String creatorId, String layoutId, AclPermission editPermission, ResourceModes resourceModes);

    Mono<Module> save(Module module);

    Mono<Module> update(String id, Module module);
}
