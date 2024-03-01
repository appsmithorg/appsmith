package com.appsmith.server.actioncollections.importable.packages;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class ActionCollectionPackageImportableServiceImpl
        implements ArtifactBasedImportableService<ActionCollection, Package> {

    private final ActionCollectionRepository repository;
    private final ActionCollectionService actionCollectionService;
    private final DefaultResourcesService<ActionCollection> defaultResourcesService;
    private final DefaultResourcesService<ActionCollectionDTO> dtoDefaultResourcesService;

    @Override
    public List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> ((Module) context).getUnpublishedModule().getName())
                .toList();
    }

    @Override
    public void renameContextInImportableResources(
            List<ActionCollection> actionCollectionList, String oldContextName, String newContextName) {
        for (ActionCollection actionCollection : actionCollectionList) {
            if (actionCollection.getUnpublishedCollection().getModuleId().equals(oldContextName)) {
                actionCollection.getUnpublishedCollection().setModuleId(newContextName);
            }
        }
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInCurrentArtifactFlux(ImportableArtifact artifact) {
        return repository.findByPackageId(artifact.getId());
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInOtherBranchesFlux(
            String defaultArtifactId, String currentArtifactId) {
        // TODO add after git support
        return Flux.empty();
    }

    @Override
    public Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackDefaultContextId) {
        ActionCollectionDTO collectionDTO = (ActionCollectionDTO) dtoObject;

        if (StringUtils.isEmpty(collectionDTO.getModuleId())) {
            collectionDTO.setModuleId(fallbackDefaultContextId);
        }

        Module defaultModule = (Module) contextMap.get(collectionDTO.getModuleId());

        if (defaultModule == null) {
            return null;
        }
        collectionDTO.setModuleId(defaultModule.getId());

        return defaultModule;
    }

    @Override
    public void populateDefaultResources(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportableArtifact artifact,
            ActionCollection branchedActionCollection,
            ActionCollection actionCollection) {
        actionCollection.setPackageId(artifact.getId());
    }

    @Override
    public void createNewResource(
            ImportingMetaDTO importingMetaDTO, ActionCollection actionCollection, Context defaultContext) {
        // TODO uncomment after permission provider has been split
        //        if (!importingMetaDTO.getPermissionProvider().canCreateAction((Module) defaultContext)) {
        //            throw new AppsmithException(
        //                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE, ((Module) defaultContext).getId());
        //        }

        // this will generate the id and other auto generated fields e.g. createdAt
        actionCollection.updateForBulkWriteOperation();
        actionCollectionService.generateAndSetPolicies((Module) defaultContext, actionCollection);

        defaultResourcesService.initialize(actionCollection, importingMetaDTO.getBranchName(), false);
        dtoDefaultResourcesService.initialize(
                actionCollection.getUnpublishedCollection(), importingMetaDTO.getBranchName(), false);

        // generate gitSyncId if it's not present
        if (actionCollection.getGitSyncId() == null) {
            actionCollection.setGitSyncId(actionCollection.getPackageId() + "_" + new ObjectId());
        }
    }
}
