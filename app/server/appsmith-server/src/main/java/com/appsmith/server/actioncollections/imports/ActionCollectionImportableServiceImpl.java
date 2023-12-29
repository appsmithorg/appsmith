package com.appsmith.server.actioncollections.imports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {
    public ActionCollectionImportableServiceImpl(
            ActionCollectionService actionCollectionService, ActionCollectionRepository repository) {
        super(actionCollectionService, repository);
    }

    @Override
    protected ActionCollection getExistingCollectionForImportedCollection(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, ActionCollection> actionsCollectionsInCurrentApp,
            ActionCollection actionCollection) {
        if (!Boolean.TRUE.equals(actionCollection.getIsPublic())) {
            return super.getExistingCollectionForImportedCollection(
                    mappedImportableResourcesDTO, actionsCollectionsInCurrentApp, actionCollection);
        }
        Map<String, ActionCollection> fQNToActionCollectionMap = actionsCollectionsInCurrentApp.values().stream()
                .collect(Collectors.toMap(
                        existingCollection ->
                                existingCollection.getUnpublishedCollection().getName(),
                        existingCollection -> existingCollection));

        return fQNToActionCollectionMap.get(
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
