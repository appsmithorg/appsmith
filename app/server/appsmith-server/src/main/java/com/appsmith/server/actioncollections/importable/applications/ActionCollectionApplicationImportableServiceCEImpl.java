package com.appsmith.server.actioncollections.importable.applications;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableServiceCE;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class ActionCollectionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableServiceCE<ActionCollection, Application> {

    private final ActionCollectionRepository repository;
    private final ActionCollectionService actionCollectionService;

    @Override
    public List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> ((NewPage) context).getUnpublishedPage().getName())
                .toList();
    }

    @Override
    public void renameContextInImportableResources(
            List<ActionCollection> actionCollectionList, String oldContextName, String newContextName) {
        for (ActionCollection actionCollection : actionCollectionList) {
            if (actionCollection.getUnpublishedCollection().getPageId().equals(oldContextName)) {
                actionCollection.getUnpublishedCollection().setPageId(newContextName);
            }
        }
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInCurrentArtifactFlux(Artifact artifact) {
        return repository.findByApplicationId(artifact.getId(), Optional.empty(), Optional.empty());
    }

    protected Flux<ActionCollection> getExistingResourcesInOtherBranchesFlux(
            List<String> branchedArtifactIds, List<String> projectionForOtherBranches) {
        return repository.findAllByApplicationIds(branchedArtifactIds, projectionForOtherBranches);
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInOtherBranchesFlux(List<String> branchedArtifactIds) {
        // Only project the fields consumed downstream during import (gitSyncId for the lookup map, and
        // id/baseId for base-id resolution). Fetching full documents here loads the heavy
        // unpublishedCollection/publishedCollection bodies across every branch, which for apps with many
        // branches can exceed the Mongo transaction lifetime limit during branch creation.
        final List<String> projectionForOtherBranches = List.of(
                ActionCollection.Fields.id,
                ActionCollection.Fields.baseId,
                ActionCollection.Fields.applicationId,
                ActionCollection.Fields.gitSyncId);

        return getExistingResourcesInOtherBranchesFlux(branchedArtifactIds, projectionForOtherBranches);
    }

    @Override
    public void updateArtifactId(ActionCollection resource, Artifact artifact) {
        resource.setApplicationId(artifact.getId());
    }

    @Override
    public Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackBaseContextId) {
        ActionCollectionDTO collectionDTO = (ActionCollectionDTO) dtoObject;

        if (StringUtils.isEmpty(collectionDTO.getPageId())) {
            collectionDTO.setPageId(fallbackBaseContextId);
        }

        NewPage parentPage = (NewPage) contextMap.get(collectionDTO.getPageId());

        if (parentPage == null) {
            return null;
        }
        collectionDTO.setPageId(parentPage.getId());
        return parentPage;
    }

    @Override
    public Mono<ActionCollection> createNewResource(
            ImportingMetaDTO importingMetaDTO, ActionCollection actionCollection, Context baseContext) {
        Mono<Boolean> canCreateAction = importingMetaDTO.getPermissionProvider().canCreateAction((NewPage) baseContext);
        return canCreateAction.flatMap(canCreate -> {
            if (!canCreate) {
                return Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, ((NewPage) baseContext).getId()));
            }

            // this will generate the id and other auto generated fields e.g. createdAt
            actionCollection.updateForBulkWriteOperation();
            actionCollectionService.generateAndSetPolicies((NewPage) baseContext, actionCollection);

            // create or update base id for the action
            // values already set to base id are kept unchanged
            actionCollection.setBaseId(actionCollection.getBaseIdOrFallback());
            actionCollection.setRefType(importingMetaDTO.getRefType());
            actionCollection.setRefName(importingMetaDTO.getRefName());

            // generate gitSyncId if it's not present
            if (actionCollection.getGitSyncId() == null) {
                actionCollection.setGitSyncId(actionCollection.getApplicationId() + "_" + UUID.randomUUID());
            }

            return Mono.just(actionCollection);
        });
    }
}
