package com.appsmith.server.modules.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.publish.publishable.PackagePublishableService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ModulePublishableServiceImpl implements PackagePublishableService<Module> {
    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;

    public ModulePublishableServiceImpl(CrudModuleService crudModuleService, ModulePermission modulePermission) {
        this.crudModuleService = crudModuleService;
        this.modulePermission = modulePermission;
    }

    @Override
    public Mono<List<Module>> getPublishableEntities(PublishingMetaDTO publishingMetaDTO) {
        Mono<List<Module>> sourceModuleListMono = crudModuleService
                .getAllModules(publishingMetaDTO.getSourcePackageId())
                .collectList();

        return sourceModuleListMono.flatMap(sourceModules -> {
            Map<String, String> moduleUUIDToOldModuleIdMap =
                    sourceModules.stream().collect(Collectors.toMap(Module::getModuleUUID, Module::getId));
            List<Module> modulesToBeSaved = prepareModulesFromModuleDTOs(sourceModules, publishingMetaDTO);
            return crudModuleService
                    .saveModuleInBulk(modulesToBeSaved)
                    .collectList()
                    .flatMap(publishedModules -> {
                        Map<String, String> moduleUUIDToNewModuleIdMap = publishedModules.stream()
                                .collect(Collectors.toMap(Module::getModuleUUID, Module::getId));

                        Map<String, String> oldModuleIdToNewModuleIdMap = moduleUUIDToOldModuleIdMap.entrySet().stream()
                                .collect(Collectors.toMap(
                                        Map.Entry::getValue, entry -> moduleUUIDToNewModuleIdMap.get(entry.getKey())));
                        publishingMetaDTO.setOldModuleIdToNewModuleIdMap(oldModuleIdToNewModuleIdMap);
                        publishingMetaDTO.setPublishedModules(publishedModules);

                        return Mono.just(publishedModules);
                    });
        });
    }

    @Override
    public Mono<Void> updatePublishableEntities(PublishingMetaDTO publishingMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    private List<Module> prepareModulesFromModuleDTOs(List<Module> sourceModules, PublishingMetaDTO publishingMetaDTO) {
        List<Module> modulesToBeSaved = new ArrayList<>();
        sourceModules.forEach(sourceModule -> {
            Module module = new Module();

            AppsmithBeanUtils.copyNestedNonNullProperties(sourceModule, module);
            module.setId(null);
            module.setPackageId(publishingMetaDTO.getPublishedPackage().getId());
            module.setPublishedModule(sourceModule.getUnpublishedModule());
            module.setUnpublishedModule(new ModuleDTO());

            // The published version of a module should only be readable and executable
            Set<Policy> updatedPolicies = module.getPolicies().stream()
                    .filter(policy -> policy.getPermission()
                                    .equals(modulePermission.getReadPermission().getValue())
                            || policy.getPermission()
                                    .equals(modulePermission
                                            .getCreateModuleInstancePermission()
                                            .getValue()))
                    .collect(Collectors.toSet());

            module.setPolicies(updatedPolicies);

            modulesToBeSaved.add(module);
        });

        return modulesToBeSaved;
    }
}
