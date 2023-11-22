package com.appsmith.server.refactors.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.CompositeEntityRefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class RefactoringSolutionImpl extends RefactoringSolutionCEImpl implements RefactoringSolution {

    private final EntityRefactoringService<ModuleInstance> moduleInstanceEntityRefactoringService;
    private final CompositeEntityRefactoringService<ModuleInstance> moduleInstanceCompositeEntityRefactoringService;

    public RefactoringSolutionImpl(
            NewPageService newPageService,
            ResponseUtils responseUtils,
            UpdateLayoutService updateLayoutService,
            ApplicationService applicationService,
            PagePermission pagePermission,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TransactionalOperator transactionalOperator,
            EntityRefactoringService<Void> jsActionEntityRefactoringService,
            EntityRefactoringService<NewAction> newActionEntityRefactoringService,
            EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService,
            EntityRefactoringService<Layout> widgetEntityRefactoringService,
            EntityRefactoringService<ModuleInstance> moduleInstanceEntityRefactoringService,
            CompositeEntityRefactoringService<ModuleInstance> moduleInstanceCompositeEntityRefactoringService) {
        super(
                newPageService,
                responseUtils,
                updateLayoutService,
                applicationService,
                pagePermission,
                analyticsService,
                sessionUserService,
                transactionalOperator,
                jsActionEntityRefactoringService,
                newActionEntityRefactoringService,
                actionCollectionEntityRefactoringService,
                widgetEntityRefactoringService);
        this.moduleInstanceEntityRefactoringService = moduleInstanceEntityRefactoringService;
        this.moduleInstanceCompositeEntityRefactoringService = moduleInstanceCompositeEntityRefactoringService;
    }

    @Override
    public Mono<LayoutDTO> refactorCompositeEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        Pattern regexPattern = getReplacementPattern(refactorEntityNameDTO.getOldName());

        // Get a hold of module instance service
        CompositeEntityRefactoringService<?> compositeEntityRefactoringService =
                this.getCompositeEntityRefactoringService(refactorEntityNameDTO);

        // Call get children method to get information about all children that need to be refactored
        Flux<RefactorEntityNameDTO> actionRefactorEntityNameDTOFlux = compositeEntityRefactoringService
                .getComposedNewActions(refactorEntityNameDTO)
                .flatMap(newAction ->
                        getActionRefactorEntityNameDTOMono(refactorEntityNameDTO, regexPattern, newAction));
        Flux<RefactorEntityNameDTO> actionCollectionRefactorEntityNameDTOFlux = compositeEntityRefactoringService
                .getComposedActionCollections(refactorEntityNameDTO)
                .flatMap(actionCollection -> getActionCollectionRefactorEntityNameDTOMono(
                        refactorEntityNameDTO, regexPattern, actionCollection));
        Flux<RefactorEntityNameDTO> moduleInstanceRefactorEntityNameDTOFlux = compositeEntityRefactoringService
                .getComposedModuleInstances(refactorEntityNameDTO)
                .flatMap(moduleInstance -> getModuleInstanceRefactorEntityNameDTOMono(
                        refactorEntityNameDTO, regexPattern, moduleInstance));
        // TODO: Leaving this for later when custom js libs is clearer
        // Flux<CustomJSLib> composedCustomJSLibs = compositeEntityRefactoringService.getComposedCustomJSLibs();

        // Call normal refactor for all children as well
        Flux<RefactorEntityNameDTO> entityNameDTOFlux = Flux.merge(
                actionRefactorEntityNameDTOFlux,
                actionCollectionRefactorEntityNameDTOFlux,
                moduleInstanceRefactorEntityNameDTOFlux);

        // Call normal refactor method for the parent composite entity ( module instance itself)
        return entityNameDTOFlux
                .flatMap(dto -> this.refactorEntityName(dto, branchName))
                .then(this.refactorEntityName(refactorEntityNameDTO, branchName));
    }

    protected Mono<RefactorEntityNameDTO> getModuleInstanceRefactorEntityNameDTOMono(
            RefactorEntityNameDTO refactorEntityNameDTO, Pattern regexPattern, ModuleInstance moduleInstance) {
        ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
        RefactorEntityNameDTO moduleInstanceRefactorEntityNameDTO = new RefactorEntityNameDTO();

        moduleInstanceRefactorEntityNameDTO.setEntityType(EntityType.MODULE_INSTANCE);
        moduleInstanceRefactorEntityNameDTO.setModuleInstanceId(moduleInstance.getId());
        moduleInstanceRefactorEntityNameDTO.setLayoutId(refactorEntityNameDTO.getLayoutId());
        moduleInstanceRefactorEntityNameDTO.setPageId(refactorEntityNameDTO.getPageId());
        moduleInstanceRefactorEntityNameDTO.setOldName(unpublishedModuleInstance.getName());
        Matcher matcher = regexPattern.matcher(unpublishedModuleInstance.getName());
        String replacedName;
        if (matcher.find()) {
            replacedName = matcher.replaceFirst(refactorEntityNameDTO.getNewName());
        } else {
            // TODO : Add error state here when writing tests
            return Mono.empty();
        }
        moduleInstanceRefactorEntityNameDTO.setNewName(replacedName);

        return Mono.just(moduleInstanceRefactorEntityNameDTO);
    }

    protected Mono<RefactorEntityNameDTO> getActionCollectionRefactorEntityNameDTOMono(
            RefactorEntityNameDTO refactorEntityNameDTO, Pattern regexPattern, ActionCollection actionCollection) {
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        RefactorEntityNameDTO actionCollectionRefactorEntityNameDTO = new RefactorEntityNameDTO();

        actionCollectionRefactorEntityNameDTO.setEntityType(EntityType.JS_OBJECT);
        actionCollectionRefactorEntityNameDTO.setActionCollectionId(actionCollection.getId());
        actionCollectionRefactorEntityNameDTO.setLayoutId(refactorEntityNameDTO.getLayoutId());
        actionCollectionRefactorEntityNameDTO.setPageId(refactorEntityNameDTO.getPageId());
        actionCollectionRefactorEntityNameDTO.setOldName(unpublishedCollection.getName());
        Matcher matcher = regexPattern.matcher(unpublishedCollection.getName());
        String replacedName;
        if (matcher.find()) {
            replacedName = matcher.replaceFirst(refactorEntityNameDTO.getNewName());
        } else {
            // TODO : Add error state here when writing tests
            return Mono.empty();
        }
        actionCollectionRefactorEntityNameDTO.setNewName(replacedName);

        return Mono.just(actionCollectionRefactorEntityNameDTO);
    }

    protected Mono<RefactorEntityNameDTO> getActionRefactorEntityNameDTOMono(
            RefactorEntityNameDTO refactorEntityNameDTO, Pattern regexPattern, NewAction newAction) {
        ActionDTO unpublishedAction = newAction.getUnpublishedAction();
        RefactorEntityNameDTO actionRefactorEntityNameDTO = new RefactorEntityNameDTO();
        if (PluginType.JS.equals(unpublishedAction.getPluginType())) {
            actionRefactorEntityNameDTO.setEntityType(EntityType.JS_ACTION);
            String[] splitName = unpublishedAction.getValidName().split("\\.");
            actionRefactorEntityNameDTO.setCollectionName(splitName[0]);
        } else {
            actionRefactorEntityNameDTO.setEntityType(EntityType.ACTION);
        }

        actionRefactorEntityNameDTO.setActionId(newAction.getId());
        actionRefactorEntityNameDTO.setLayoutId(refactorEntityNameDTO.getLayoutId());
        actionRefactorEntityNameDTO.setPageId(refactorEntityNameDTO.getPageId());
        actionRefactorEntityNameDTO.setOldName(unpublishedAction.getName());
        Matcher matcher = regexPattern.matcher(unpublishedAction.getName());
        String replacedName;
        if (matcher.find()) {
            replacedName = matcher.replaceFirst(refactorEntityNameDTO.getNewName());
        } else {
            // TODO : Add error state here when writing tests
            return Mono.empty();
        }
        actionRefactorEntityNameDTO.setNewName(replacedName);

        return Mono.just(actionRefactorEntityNameDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    protected EntityRefactoringService<?> getEntityRefactoringService(RefactorEntityNameDTO refactorEntityNameDTO) {
        EntityRefactoringService<?> entityRefactoringService = super.getEntityRefactoringService(refactorEntityNameDTO);

        if (entityRefactoringService == null) {
            return switch (refactorEntityNameDTO.getEntityType()) {
                case MODULE_INSTANCE -> moduleInstanceEntityRefactoringService;
                default -> null;
            };
        }
        return entityRefactoringService;
    }

    @Override
    protected Iterable<Flux<String>> getExistingEntityNamesFlux(
            String contextId, String layoutId, boolean isFQN, CreatorContextType contextType) {
        Iterable<Flux<String>> existingEntityNamesFluxFromSuper =
                super.getExistingEntityNamesFlux(contextId, layoutId, isFQN, contextType);

        Flux<String> existingModuleInstanceNamesFlux =
                moduleInstanceEntityRefactoringService.getExistingEntityNames(contextId, contextType, layoutId);

        ArrayList<Flux<String>> entityNamesFlux =
                new ArrayList<>((Collection<Flux<String>>) existingEntityNamesFluxFromSuper);

        entityNamesFlux.add(existingModuleInstanceNamesFlux);

        return entityNamesFlux;
    }

    protected CompositeEntityRefactoringService<?> getCompositeEntityRefactoringService(
            RefactorEntityNameDTO refactorEntityNameDTO) {
        return switch (refactorEntityNameDTO.getEntityType()) {
            case MODULE_INSTANCE -> moduleInstanceCompositeEntityRefactoringService;
            default -> null;
        };
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    protected Mono<Void> refactorAllReferences(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<Void> moduleInstancesMono = moduleInstanceEntityRefactoringService.refactorReferencesInExistingEntities(
                refactorEntityNameDTO, refactoringMetaDTO);
        return super.refactorAllReferences(refactorEntityNameDTO, refactoringMetaDTO)
                .then(moduleInstancesMono);
    }
}
