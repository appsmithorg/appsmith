package com.appsmith.server.newactions.importable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableServiceCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class NewActionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableServiceCE<NewAction, Application> {

    private final NewActionRepositoryCake repository;
    private final NewActionService newActionService;

    @Override
    public List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> ((NewPage) context).getUnpublishedPage().getName())
                .toList();
    }

    @Override
    public void renameContextInImportableResources(
            List<NewAction> newActionList, String oldContextName, String newContextName) {
        for (NewAction newAction : newActionList) {
            if (newAction.getUnpublishedAction().getPageId().equals(oldContextName)) {
                newAction.getUnpublishedAction().setPageId(newContextName);
            }
        }
    }

    @Override
    public Flux<NewAction> getExistingResourcesInCurrentArtifactFlux(Artifact artifact) {
        return repository.findByApplicationId(artifact.getId(), Optional.empty(), Optional.empty());
    }

    @Override
    public Flux<NewAction> getExistingResourcesInOtherBranchesFlux(
            List<String> branchedArtifactIds, String currentArtifactId) {
        return repository
                .findAllByApplicationIds(branchedArtifactIds, null)
                .filter(newAction -> !Objects.equals(newAction.getApplicationId(), currentArtifactId));
    }

    @Override
    public void updateArtifactId(NewAction resource, Artifact artifact) {
        resource.setApplicationId(artifact.getId());
    }

    @Override
    public Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackBaseContextId) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;

        if (StringUtils.isEmpty(actionDTO.getPageId())) {
            actionDTO.setPageId(fallbackBaseContextId);
        }

        NewPage parentPage = (NewPage) contextMap.get(actionDTO.getPageId());

        if (parentPage == null) {
            return null;
        }
        actionDTO.setPageId(parentPage.getId());

        return parentPage;
    }

    @Override
    public void createNewResource(ImportingMetaDTO importingMetaDTO, NewAction newAction, Context baseContext) {
        if (!importingMetaDTO.getPermissionProvider().canCreateAction((NewPage) baseContext)) {
            throw new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, ((NewPage) baseContext).getId());
        }

        // this will generate the id and other auto generated fields e.g. createdAt
        newAction.updateForBulkWriteOperation();
        newActionService.generateAndSetActionPolicies((NewPage) baseContext, newAction);

        // create or update base id for the action
        // values already set to base id are kept unchanged
        newAction.setBaseId(newAction.getBaseIdOrFallback());
        newAction.setRefType(importingMetaDTO.getRefType());
        newAction.setRefName(importingMetaDTO.getRefName());

        // generate gitSyncId if it's not present
        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getApplicationId() + "_" + UUID.randomUUID());
        }
    }
}
