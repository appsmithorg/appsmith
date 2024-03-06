package com.appsmith.server.actioncollections.importable;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PACKAGE;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {

    private final ArtifactBasedImportableService<ActionCollection, Package> packageImportableService;

    public ActionCollectionImportableServiceImpl(
            ActionCollectionRepository repository,
            ArtifactBasedImportableService<ActionCollection, Application> applicationImportableService,
            ArtifactBasedImportableService<ActionCollection, Package> packageImportableService) {
        super(repository, applicationImportableService);
        this.packageImportableService = packageImportableService;
    }

    @Override
    public ArtifactBasedImportableService<ActionCollection, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return switch (importingMetaDTO.getArtifactType()) {
            case APPLICATION -> super.getArtifactBasedImportableService(importingMetaDTO);
            case PACKAGE -> packageImportableService;
            default -> null;
        };
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
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact,
            ActionCollection actionCollection) {
        if (!Boolean.TRUE.equals(actionCollection.getIsPublic())) {
            return super.getExistingCollectionInCurrentBranchForImportedCollection(
                    mappedImportableResourcesDTO, actionsCollectionsInCurrentArtifact, actionCollection);
        }
        Map<String, ActionCollection> nameToCollectionMap = actionsCollectionsInCurrentArtifact.values().stream()
                .collect(Collectors.toMap(
                        collection -> collection.getUnpublishedCollection().getName(),
                        collection -> collection,
                        (u, v) -> u));

        return nameToCollectionMap.get(
                actionCollection.getUnpublishedCollection().getName());
    }

    @Override
    protected boolean existingArtifactContainsCollection(
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact, ActionCollection actionCollection) {
        return super.existingArtifactContainsCollection(actionsCollectionsInCurrentArtifact, actionCollection)
                || (Boolean.TRUE.equals(actionCollection.getIsPublic())
                        && actionsCollectionsInCurrentArtifact.values().stream()
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
