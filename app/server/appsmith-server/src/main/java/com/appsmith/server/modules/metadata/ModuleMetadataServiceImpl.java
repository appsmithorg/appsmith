package com.appsmith.server.modules.metadata;

import com.appsmith.server.domains.Module;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.packages.metadata.PackageMetadataService;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ModuleMetadataServiceImpl implements ModuleMetadataService {
    private final ModuleRepository repository;
    private final ModulePermission modulePermission;
    private final PackageMetadataService packageMetadataService;
    private final SessionUserService sessionUserService;

    /**
     * Sets the updatedAt and modifiedBy fields of the Module
     *
     * @param moduleId Module ID
     * @return Module Mono of updated Package
     */
    @Override
    public Mono<Module> saveLastEditInformation(String moduleId) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(currentUser -> {
                    Module module = new Module();

                    module.setLastEditedAt(Instant.now());
                    module.setModifiedBy(currentUser.getUsername());
                    /*
                     We're not setting updatedAt and modifiedBy fields to the packageDTO DTO because these fields will be set
                     by the updateById method of the BaseAppsmithRepositoryImpl
                    */
                    return repository.updateById(moduleId, module, modulePermission.getEditPermission());
                })
                .flatMap(updatedModule -> packageMetadataService
                        .saveLastEditInformation(updatedModule.getPackageId())
                        .thenReturn(updatedModule));
    }
}
