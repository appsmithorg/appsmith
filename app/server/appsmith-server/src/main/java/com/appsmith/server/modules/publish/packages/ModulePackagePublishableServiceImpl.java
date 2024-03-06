package com.appsmith.server.modules.publish.packages;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.publish.packages.publishable.PackagePublishableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class ModulePackagePublishableServiceImpl implements PackagePublishableService<Module> {
    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;

    @Override
    public Mono<List<Module>> publishEntities(PackagePublishingMetaDTO publishingMetaDTO) {
        Mono<List<Module>> sourceModuleListMono = crudModuleService
                .getAllModules(publishingMetaDTO.getOriginPackageId(), modulePermission.getReadPermission())
                .collectList();

        return sourceModuleListMono.flatMap(sourceModules -> {
            List<Module> modulesToBeSaved = prepareModulesFromModuleDTOs(sourceModules, publishingMetaDTO);
            return crudModuleService
                    .saveModuleInBulk(modulesToBeSaved)
                    .collectList()
                    .map(publishedModules -> {
                        Map<String, Module> originModuleIdToPublishedModuleMap = publishedModules.stream()
                                .collect(Collectors.toMap(Module::getOriginModuleId, module -> module));
                        publishingMetaDTO.setOriginModuleIdToPublishedModuleMap(originModuleIdToPublishedModuleMap);

                        return publishedModules;
                    });
        });
    }

    private List<Module> prepareModulesFromModuleDTOs(
            List<Module> sourceModules, PackagePublishingMetaDTO publishingMetaDTO) {
        List<Module> modulesToBeSaved = new ArrayList<>();
        sourceModules.forEach(sourceModule -> {
            Module module = new Module();

            AppsmithBeanUtils.copyNestedNonNullProperties(sourceModule, module);
            module.setId(null);
            module.setOriginModuleId(sourceModule.getId());
            module.setPackageId(publishingMetaDTO.getPublishedPackage().getId());
            module.setVersion(publishingMetaDTO.getPublishedPackage().getVersion());
            module.setPublishedModule(sourceModule.getUnpublishedModule());
            module.setUnpublishedModule(new ModuleDTO());

            module.setPolicies(module.getPolicies());

            modulesToBeSaved.add(module);
        });

        return modulesToBeSaved;
    }
}
