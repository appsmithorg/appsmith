package com.appsmith.server.moduleinstances.clonepage;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ModuleInstanceClonePageServiceImpl extends ModuleInstanceClonePageServiceCompatibleCEImpl
        implements ClonePageService<ModuleInstance> {
    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;
    private final CrudModuleInstanceService crudModuleInstanceService;
    private final NewActionService newActionService;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        Flux<ModuleInstance> sourceModuleInstanceFlux = repository.findByPageIds(
                List.of(clonePageMetaDTO.getBranchedSourcePageId()),
                Optional.of(moduleInstancePermission.getReadPermission()));

        return sourceModuleInstanceFlux
                .flatMap(sourceModuleInstance -> {
                    Mono<Map<String, NewAction>> sourcePublicActionMapMono =
                            getSourcePublicActionMapMono(sourceModuleInstance);

                    ModuleInstanceDTO moduleInstanceReqDTO =
                            getModuleInstanceReqDTO(clonePageMetaDTO, sourceModuleInstance);

                    return crudModuleInstanceService
                            .createModuleInstance(moduleInstanceReqDTO, clonePageMetaDTO.getBranchName())
                            .flatMap(createModuleInstanceResponseDTO -> {
                                ModuleInstanceDTO clonedModuleInstanceDTO =
                                        createModuleInstanceResponseDTO.getModuleInstance();
                                Mono<Map<String, NewAction>> clonedPublicActionMapMono =
                                        getClonedPublicActionMapMono(clonedModuleInstanceDTO);

                                return Mono.zip(sourcePublicActionMapMono, clonedPublicActionMapMono)
                                        .flatMap(tuple2 -> {
                                            Map<String, NewAction> sourcePublicActionMap = tuple2.getT1();
                                            Map<String, NewAction> clonedPublicActionMap = tuple2.getT2();
                                            clonedPublicActionMap.forEach((key, clonedPublicAction) -> {
                                                NewAction sourcePublicAction =
                                                        sourcePublicActionMap.get(generateKey(clonedPublicAction));

                                                ActionDTO clonedPublicActionDTO =
                                                        clonedPublicAction.getUnpublishedAction();
                                                ActionDTO sourcePublicActionDTO =
                                                        sourcePublicAction.getUnpublishedAction();

                                                // Retain configs of public action from source to cloned
                                                retainPublicEntitySettings(
                                                        sourcePublicActionDTO, clonedPublicActionDTO);
                                            });
                                            List<NewAction> toBeUpdatedClonedPublicActions =
                                                    new ArrayList<>(clonedPublicActionMap.values());
                                            return Mono.just(toBeUpdatedClonedPublicActions);
                                        })
                                        .flatMap(toBeUpdatedClonedPublicActions -> newActionService
                                                .saveAll(toBeUpdatedClonedPublicActions)
                                                .collectList());
                            });
                })
                .then();
    }

    @Override
    public Mono<Void> updateClonedEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    private Mono<Map<String, NewAction>> getClonedPublicActionMapMono(ModuleInstanceDTO clonedModuleInstanceDTO) {
        Mono<Map<String, NewAction>> clonedPublicActionMapMono = newActionService
                .findPublicActionsByModuleInstanceId(clonedModuleInstanceDTO.getId(), Optional.empty())
                .collectMap(
                        clonedPublicAction -> generateKey(clonedPublicAction),
                        sourcePublicAction -> sourcePublicAction);
        return clonedPublicActionMapMono;
    }

    private Mono<Map<String, NewAction>> getSourcePublicActionMapMono(ModuleInstance sourceModuleInstance) {
        Mono<Map<String, NewAction>> sourcePublicActionMapMono = newActionService
                .findPublicActionsByModuleInstanceId(sourceModuleInstance.getId(), Optional.empty())
                .collectMap(
                        sourcePublicAction -> generateKey(sourcePublicAction),
                        sourcePublicAction -> sourcePublicAction);
        return sourcePublicActionMapMono;
    }

    private static ModuleInstanceDTO getModuleInstanceReqDTO(
            ClonePageMetaDTO clonePageMetaDTO, ModuleInstance sourceModuleInstance) {
        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setSourceModuleId(sourceModuleInstance.getSourceModuleId());
        moduleInstanceReqDTO.setContextId(clonePageMetaDTO.getClonedPageDTO().getId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName(
                sourceModuleInstance.getUnpublishedModuleInstance().getName());
        moduleInstanceReqDTO.setInputs(
                sourceModuleInstance.getUnpublishedModuleInstance().getInputs());
        return moduleInstanceReqDTO;
    }

    private void retainPublicEntitySettings(ActionDTO sourcePublicActionDTO, ActionDTO clonedPublicActionDTO) {
        clonedPublicActionDTO.setUserSetOnLoad(sourcePublicActionDTO.getUserSetOnLoad());
        clonedPublicActionDTO.setExecuteOnLoad(sourcePublicActionDTO.getExecuteOnLoad());
        clonedPublicActionDTO.setConfirmBeforeExecute(sourcePublicActionDTO.getConfirmBeforeExecute());
    }

    private String generateKey(NewAction newAction) {
        // validName itself is unique in the scope of page
        return newAction.getUnpublishedAction().getValidName() + newAction.getOriginActionId();
    }
}
