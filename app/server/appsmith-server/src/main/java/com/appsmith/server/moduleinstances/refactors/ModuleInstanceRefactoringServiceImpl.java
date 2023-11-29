package com.appsmith.server.moduleinstances.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.DslUtils;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.CompositeEntityRefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_MODULE_INSTANCE;

@RequiredArgsConstructor
@Slf4j
@Service
public class ModuleInstanceRefactoringServiceImpl extends ModuleInstanceRefactoringServiceCECompatibleImpl
        implements EntityRefactoringService<ModuleInstance>, CompositeEntityRefactoringService<ModuleInstance> {
    private final LayoutModuleInstanceService moduleInstanceService;
    private final ModuleInstancePermission moduleInstancePermission;
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ActionCollectionService actionCollectionService;
    private final AstService astService;
    private final InstanceConfig instanceConfig;
    private final ObjectMapper objectMapper;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_MODULE_INSTANCE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<Integer> evalVersionMono = refactoringMetaDTO.getEvalVersionMono();
        Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        String pageId = refactorEntityNameDTO.getPageId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();
        return moduleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        pageId, CreatorContextType.PAGE, ResourceModes.EDIT, null)
                .flatMapMany(Flux::fromIterable)
                .zipWith(evalVersionMono)
                .flatMap(tuple -> {
                    final ModuleInstanceDTO moduleInstanceDTO = tuple.getT1();
                    final Integer evalVersion = tuple.getT2();

                    return this.refactorNameInModuleInstance(
                                    moduleInstanceDTO, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(updates -> {
                                if (updates.isEmpty()) {
                                    return Mono.just(moduleInstanceDTO);
                                }
                                updatedBindingPaths.addAll(updates);
                                return moduleInstanceService.updateUnpublishedModuleInstance(
                                        moduleInstanceDTO, moduleInstanceDTO.getId(), null, true);
                            });
                })
                .map(ModuleInstanceDTO::getName)
                .collectList()
                .doOnNext(updatedModuleInstanceNames -> log.debug(
                        "Module instances updated due to refactor name in page {} are : {}",
                        pageId,
                        updatedModuleInstanceNames))
                .then();
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        return moduleInstanceService
                .findByBranchNameAndDefaultModuleInstanceId(
                        branchName,
                        refactorEntityNameDTO.getModuleInstanceId(),
                        moduleInstancePermission.getEditPermission())
                .flatMap(branchedModuleInstance -> moduleInstanceService.generateModuleInstanceByViewMode(
                        branchedModuleInstance, ResourceModes.EDIT))
                .flatMap(moduleInstanceDTO -> {
                    moduleInstanceDTO.setName(refactorEntityNameDTO.getNewName());
                    return moduleInstanceService.updateUnpublishedModuleInstance(
                            moduleInstanceDTO, moduleInstanceDTO.getId(), null, true);
                })
                .then();
    }

    private Mono<Set<String>> refactorNameInModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO,
            String oldName,
            String newName,
            int evalVersion,
            Pattern oldNamePattern) {
        // If we're going the fallback route (without AST), we can first filter actions to be refactored
        // By performing a check on whether json path keys had a reference
        // This is not needed in the AST way since it would be costlier to make double the number of API calls
        if (Boolean.FALSE.equals(this.instanceConfig.getIsRtsAccessible())) {
            Set<String> jsonPathKeys = moduleInstanceDTO.getJsonPathKeys();

            boolean isReferenceFound = false;
            if (jsonPathKeys != null && !jsonPathKeys.isEmpty()) {
                // Since json path keys actually contain the entire inline js function instead of just the widget/action
                // name, we can not simply use the set.contains(obj) function. We need to iterate over all the keys
                // in the set and see if the old name is a substring of the json path key.
                for (String key : jsonPathKeys) {
                    if (oldNamePattern.matcher(key).find()) {
                        isReferenceFound = true;
                        break;
                    }
                }
            }
            // If no reference was found, return with an empty set
            if (Boolean.FALSE.equals(isReferenceFound)) {
                return Mono.just(new HashSet<>());
            }
        }

        final JsonNode inputsNode = objectMapper.convertValue(moduleInstanceDTO.getInputs(), JsonNode.class);

        Mono<Set<String>> refactorDynamicBindingsMono = Mono.just(new HashSet<>());

        // If there are dynamic bindings in this action configuration, inspect them
        if (moduleInstanceDTO.getDynamicBindingPathList() != null
                && !moduleInstanceDTO.getDynamicBindingPathList().isEmpty()) {
            // recurse over each child
            refactorDynamicBindingsMono = Flux.fromIterable(moduleInstanceDTO.getDynamicBindingPathList())
                    .flatMap(dynamicBindingPath -> {
                        String key = dynamicBindingPath.getKey();
                        Set<MustacheBindingToken> mustacheValues =
                                DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(inputsNode, key);
                        return astService
                                .replaceValueInMustacheKeys(
                                        mustacheValues, oldName, newName, evalVersion, oldNamePattern)
                                .flatMap(replacementMap -> {
                                    if (replacementMap.isEmpty()) {
                                        return Mono.empty();
                                    }
                                    DslUtils.replaceValuesInSpecificDynamicBindingPath(inputsNode, key, replacementMap);
                                    return Mono.just(key);
                                });
                    })
                    .collect(Collectors.toSet())
                    .map(entityPaths -> {
                        moduleInstanceDTO.setInputs(
                                objectMapper.convertValue(inputsNode, new TypeReference<HashMap<String, String>>() {}));
                        return entityPaths;
                    });
        }

        return refactorDynamicBindingsMono;
    }

    @Override
    public Flux<NewAction> getComposedNewActions(RefactorEntityNameDTO refactorEntityNameDTO) {
        return newActionService.findAllUnpublishedComposedActionsByRootModuleInstanceId(
                refactorEntityNameDTO.getModuleInstanceId(), actionPermission.getEditPermission(), true);
    }

    @Override
    public Flux<ActionCollection> getComposedActionCollections(RefactorEntityNameDTO refactorEntityNameDTO) {
        return actionCollectionService.findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
                refactorEntityNameDTO.getModuleInstanceId(), actionPermission.getEditPermission());
    }

    @Override
    public Flux<ModuleInstance> getComposedModuleInstances(RefactorEntityNameDTO refactorEntityNameDTO) {
        return moduleInstanceService.findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
                refactorEntityNameDTO.getPageId(),
                CreatorContextType.PAGE, // Since refactor is only for pages for now
                refactorEntityNameDTO.getModuleInstanceId(),
                moduleInstancePermission.getEditPermission());
    }

    @Override
    public Flux<CustomJSLib> getComposedCustomJSLibs(RefactorEntityNameDTO refactorEntityNameDTO) {
        return Flux.empty();
    }

    @Override
    public Flux<String> getExistingEntityNames(String contextId, CreatorContextType contextType, String layoutId) {
        return moduleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        contextId, contextType, ResourceModes.EDIT, null)
                .flatMapMany(Flux::fromIterable)
                .map(ModuleInstanceDTO::getName);
    }

    @Override
    public Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Pattern oldNamePattern,
            Mono<Integer> evalVersionMono) {
        return evalVersionMono.flatMap(evalVersion -> this.refactorNameInModuleInstance(
                        (ModuleInstanceDTO) currentEntity,
                        refactorEntityNameDTO.getOldFullyQualifiedName(),
                        refactorEntityNameDTO.getNewFullyQualifiedName(),
                        evalVersion,
                        oldNamePattern)
                .thenReturn(currentEntity));
    }

    @Override
    public Flux<RefactorEntityNameDTO> getRefactorDTOsForExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId) {
        return this.getExistingEntityNames(contextId, contextType, layoutId)
                .map(moduleInstanceName -> {
                    RefactorEntityNameDTO dto = new RefactorEntityNameDTO();
                    dto.setOldName(moduleInstanceName);
                    dto.setEntityType(EntityType.MODULE_INSTANCE);
                    return dto;
                })
                .map(refactorEntityNameDTO -> {
                    this.sanitizeRefactorEntityDTO(refactorEntityNameDTO);
                    return refactorEntityNameDTO;
                });
    }
}
