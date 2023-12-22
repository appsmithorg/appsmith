package com.appsmith.server.moduleinstances.upgrade;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.publish.packages.upgradable.PackageUpgradableService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class ModuleInstancePackageUpgradableServiceImpl implements PackageUpgradableService<ModuleInstance> {

    private final CrudModuleInstanceService crudModuleInstanceService;
    private final LayoutModuleInstanceService layoutModuleInstanceService;
    private final ModuleInstanceRepository repository;

    @Override
    public Mono<Boolean> getUpgradableEntitiesReferences(PackagePublishingMetaDTO publishingMetaDTO) {

        return Flux.fromIterable(publishingMetaDTO
                        .getOriginModuleIdToPublishedModuleMap()
                        .values())
                .flatMap(newSourceModule -> crudModuleInstanceService
                        .findAllUnpublishedByOriginModuleId(newSourceModule.getOriginModuleId(), Optional.empty())
                        .collectMap(ModuleInstance::getId, moduleInstance -> moduleInstance)
                        .doOnNext(map -> publishingMetaDTO
                                .getExistingModuleInstanceIdToModuleInstanceMap()
                                .putAll(map))
                        .flatMapMany(map -> Flux.fromIterable(map.keySet()))
                        .flatMap(moduleInstanceId -> layoutModuleInstanceService
                                .findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(moduleInstanceId, null)
                                .collectMap(ModuleInstance::getOriginModuleInstanceId, moduleInstance -> moduleInstance)
                                .doOnNext(map -> publishingMetaDTO
                                        .getExistingComposedModuleInstanceRefToModuleInstanceMap()
                                        .put(moduleInstanceId, map))))
                .collectList()
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> updateExistingEntities(
            ModuleInstance existingModuleInstance,
            SimulatedModuleInstanceDTO simulatedModuleInstanceDTO,
            PackagePublishingMetaDTO publishingMetaDTO) {

        ModuleInstanceDTO createdModuleInstanceDTO = simulatedModuleInstanceDTO.getCreatedModuleInstance();

        ModuleInstanceDTO existingModuleInstanceDTO = existingModuleInstance.getUnpublishedModuleInstance();

        Map<String, String> mergedInputs =
                mergeInputs(createdModuleInstanceDTO.getInputs(), existingModuleInstanceDTO.getInputs());

        existingModuleInstanceDTO.setInputs(mergedInputs);
        // TODO: Update dynamic binding path list

        existingModuleInstance.setSourceModuleId(createdModuleInstanceDTO.getSourceModuleId());

        crudModuleInstanceService.extractAndSetJsonPathKeys(existingModuleInstance);

        return repository.save(existingModuleInstance).thenReturn(true);
    }

    private Map<String, String> mergeInputs(Map<String, String> newInputs, Map<String, String> oldInputs) {
        if (oldInputs == null || oldInputs.isEmpty()) {
            return newInputs;
        }
        if (newInputs == null || newInputs.isEmpty()) {
            return Collections.emptyMap();
        }
        return newInputs.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> oldInputs.containsKey(entry.getKey())
                                ? oldInputs.get(entry.getKey())
                                : entry.getValue()));
    }
}
