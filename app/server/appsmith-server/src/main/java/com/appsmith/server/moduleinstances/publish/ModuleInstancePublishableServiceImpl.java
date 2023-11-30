package com.appsmith.server.moduleinstances.publish;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ApplicationPublishingMetaDTO;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.publish.publishable.ApplicationPublishableService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ModuleInstancePublishableServiceImpl implements ApplicationPublishableService<ModuleInstance> {
    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;

    @Override
    public Mono<List<ModuleInstance>> publishEntities(ApplicationPublishingMetaDTO applicationPublishingMetaDTO) {
        Flux<ModuleInstance> moduleInstanceFlux = repository.findAllByApplicationId(
                applicationPublishingMetaDTO.getApplicationId(),
                Optional.of(moduleInstancePermission.getEditPermission()));

        // 1. Archive deleted unpublished module instances
        // 2. Fetch all module instances by applicationId
        // 3. For each module instance, copy unpublished data to published state

        return repository
                .archiveDeletedUnpublishedModuleInstances(
                        applicationPublishingMetaDTO.getApplicationId(), moduleInstancePermission.getDeletePermission())
                .then(moduleInstanceFlux
                        .flatMap(moduleInstance -> {
                            moduleInstance.setPublishedModuleInstance(moduleInstance.getUnpublishedModuleInstance());
                            return repository.save(moduleInstance);
                        })
                        .collectList());
    }
}
