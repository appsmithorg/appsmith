package com.appsmith.server.modules.services.crud;

import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.solutions.ModulePermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CrudModuleServiceImpl extends CrudModuleServiceCECompatibleImpl implements CrudModuleService {
    private final ModuleRepository moduleRepository;
    private final ModulePermission modulePermission;

    public CrudModuleServiceImpl(ModuleRepository moduleRepository, ModulePermission modulePermission) {
        super(moduleRepository);
        this.moduleRepository = moduleRepository;
        this.modulePermission = modulePermission;
    }

    @Override
    public Mono<List<ModuleDTO>> getAllModules(String packageId, ResourceModes resourceMode) {
        return moduleRepository
                .getAllModulesByPackageId(packageId, modulePermission.getReadPermission())
                .flatMap(module -> {
                    ModuleDTO moduleDTO;
                    if (resourceMode.equals(ResourceModes.EDIT)) {
                        moduleDTO = module.getUnpublishedModule();
                    } else {
                        moduleDTO = module.getPublishedModule();
                    }
                    return setTransientFieldsFromModuleToModuleDTO(module, moduleDTO);
                })
                .collectList();
    }

    private Mono<ModuleDTO> setTransientFieldsFromModuleToModuleDTO(Module module, ModuleDTO moduleDTO) {
        moduleDTO.setModuleUUID(module.getModuleUUID());
        moduleDTO.setId(module.getId());
        moduleDTO.setType(module.getType());
        moduleDTO.setPackageId(module.getPackageId());
        moduleDTO.setPackageUUID(module.getPackageUUID());
        moduleDTO.setUserPermissions(module.getUserPermissions());

        return Mono.just(moduleDTO);
    }
}
