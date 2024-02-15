package com.appsmith.server.actioncollections.importable;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {

    public ActionCollectionImportableServiceImpl(
            ActionCollectionRepository repository,
            ArtifactBasedImportableService<ActionCollection, Application> applicationImportableService) {
        super(repository, applicationImportableService);
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
                        collection -> collection.getUnpublishedCollection().getName(),
                        collection -> collection,
                        (u, v) -> u));

        return nameToCollectionMap.get(
                actionCollection.getUnpublishedCollection().getName());
    }

    @Override
    protected boolean existingArtifactContainsCollection(
            Map<String, ActionCollection> actionsCollectionsInCurrentApp, ActionCollection actionCollection) {
        return super.existingArtifactContainsCollection(actionsCollectionsInCurrentApp, actionCollection)
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
