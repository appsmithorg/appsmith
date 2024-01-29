package com.appsmith.server.actioncollections.imports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {
    public ActionCollectionImportableServiceImpl(
            ActionCollectionService actionCollectionService,
            ActionCollectionRepository repository,
            DefaultResourcesService<ActionCollection> defaultResourcesService,
            DefaultResourcesService<ActionCollectionDTO> dtoDefaultResourcesService) {
        super(actionCollectionService, repository, defaultResourcesService, dtoDefaultResourcesService);
    }

    @Override
    protected Flux<ActionCollection> getCollectionsInCurrentAppFlux(Application importedApplication) {
        return super.getCollectionsInCurrentAppFlux(importedApplication)
                .filter(actionCollection -> actionCollection.getRootModuleInstanceId() == null
                        || TRUE.equals(actionCollection.getIsPublic()));
    }

    @Override
    protected Flux<ActionCollection> getCollectionsInOtherBranchesFlux(String defaultApplicationId) {
        return super.getCollectionsInOtherBranchesFlux(defaultApplicationId)
                .filter(actionCollection -> actionCollection.getRootModuleInstanceId() == null
                        || TRUE.equals(actionCollection.getIsPublic()));
    }

    @Override
    protected void updateImportableCollectionFromExistingCollection(
            ActionCollection existingActionCollection, ActionCollection actionCollection) {
        super.updateImportableCollectionFromExistingCollection(existingActionCollection, actionCollection);

        actionCollection.setModuleInstanceId(existingActionCollection.getModuleInstanceId());
        actionCollection.setRootModuleInstanceId(existingActionCollection.getRootModuleInstanceId());
    }

    @Override
    protected ActionCollection getExistingCollectionInCurrentBranchForImportedCollection(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, ActionCollection> actionsCollectionsInCurrentApp,
            ActionCollection actionCollection) {
        if (!Boolean.TRUE.equals(actionCollection.getIsPublic())) {
            return super.getExistingCollectionInCurrentBranchForImportedCollection(
                    mappedImportableResourcesDTO, actionsCollectionsInCurrentApp, actionCollection);
        }
        Map<String, ActionCollection> nameToCollectionMap = actionsCollectionsInCurrentApp.values().stream()
                .collect(Collectors.toMap(
                        collection -> collection.getUnpublishedCollection().getName(), collection -> collection));

        return nameToCollectionMap.get(
                actionCollection.getUnpublishedCollection().getName());
    }

    @Override
    protected ActionCollection getExistingCollectionInOtherBranchesForImportedCollection(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, ActionCollection> actionsCollectionsInCurrentApp,
            ActionCollection actionCollection) {
        if (!Boolean.TRUE.equals(actionCollection.getIsPublic())) {
            return super.getExistingCollectionInOtherBranchesForImportedCollection(
                    mappedImportableResourcesDTO, actionsCollectionsInCurrentApp, actionCollection);
        }
        Map<String, ActionCollection> nameToCollectionMap = actionsCollectionsInCurrentApp.values().stream()
                .collect(Collectors.toMap(
                        collection -> collection.getUnpublishedCollection().getName(), collection -> collection));

        return nameToCollectionMap.get(
                actionCollection.getUnpublishedCollection().getName());
    }

    @Override
    protected boolean existingAppContainsCollection(
            Map<String, ActionCollection> actionsCollectionsInCurrentApp, ActionCollection actionCollection) {
        return super.existingAppContainsCollection(actionsCollectionsInCurrentApp, actionCollection)
                || (Boolean.TRUE.equals(actionCollection.getIsPublic())
                        && actionsCollectionsInCurrentApp.values().stream()
                                .anyMatch(actionCollection1 -> actionCollection
                                        .getUnpublishedCollection()
                                        .getName()
                                        .equals(actionCollection1
                                                .getUnpublishedCollection()
                                                .getName())));
    }

    @Override
    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, ActionCollection actionCollection) {
        super.populateDomainMappedReferences(mappedImportableResourcesDTO, actionCollection);

        Map<String, String> moduleInstanceRefToIdMap = mappedImportableResourcesDTO.getModuleInstanceRefToIdMap();
        actionCollection.setRootModuleInstanceId(
                moduleInstanceRefToIdMap.get(actionCollection.getRootModuleInstanceId()));
        actionCollection.setModuleInstanceId(moduleInstanceRefToIdMap.get(actionCollection.getModuleInstanceId()));
    }
}
