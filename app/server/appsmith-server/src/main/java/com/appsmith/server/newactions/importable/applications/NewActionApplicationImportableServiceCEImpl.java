package com.appsmith.server.newactions.importable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableServiceCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class NewActionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableServiceCE<NewAction, Application> {

    private final NewActionRepository repository;
    private final DefaultResourcesService<NewAction> defaultResourcesService;
    private final DefaultResourcesService<ActionDTO> dtoDefaultResourcesService;
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
    public Flux<NewAction> getExistingResourcesInOtherBranchesFlux(String defaultArtifactId, String currentArtifactId) {
        return repository
                .findByDefaultApplicationId(defaultArtifactId, Optional.empty())
                .filter(newAction -> !Objects.equals(newAction.getApplicationId(), currentArtifactId));
    }

    @Override
    public Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackDefaultContextId) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;

        if (StringUtils.isEmpty(actionDTO.getPageId())) {
            actionDTO.setPageId(fallbackDefaultContextId);
        }

        NewPage parentPage = (NewPage) contextMap.get(actionDTO.getPageId());

        if (parentPage == null) {
            return null;
        }
        actionDTO.setPageId(parentPage.getId());

        // Update defaultResources in actionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        actionDTO.setDefaultResources(defaultResources);

        return parentPage;
    }

    @Override
    public void populateDefaultResources(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Artifact artifact,
            NewAction branchedNewAction,
            NewAction newAction) {
        newAction.setApplicationId(artifact.getId());

        if (artifact.getGitArtifactMetadata() != null) {
            if (branchedNewAction != null) {
                defaultResourcesService.setFromOtherBranch(
                        newAction, branchedNewAction, importingMetaDTO.getBranchName());
                dtoDefaultResourcesService.setFromOtherBranch(
                        newAction.getUnpublishedAction(),
                        branchedNewAction.getUnpublishedAction(),
                        importingMetaDTO.getBranchName());
            } else {
                // This is the first action we are saving with given gitSyncId
                // in this instance
                DefaultResources defaultResources = new DefaultResources();
                defaultResources.setApplicationId(
                        artifact.getGitArtifactMetadata().getDefaultArtifactId());
                defaultResources.setActionId(newAction.getId());
                defaultResources.setBranchName(importingMetaDTO.getBranchName());
                newAction.setDefaultResources(defaultResources);
            }
        } else {
            DefaultResources defaultResources = new DefaultResources();
            defaultResources.setApplicationId(artifact.getId());
            defaultResources.setActionId(newAction.getId());
            newAction.setDefaultResources(defaultResources);
        }
    }

    @Override
    public void createNewResource(ImportingMetaDTO importingMetaDTO, NewAction newAction, Context defaultContext) {
        if (!importingMetaDTO.getPermissionProvider().canCreateAction((NewPage) defaultContext)) {
            throw new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, ((NewPage) defaultContext).getId());
        }

        // this will generate the id and other auto generated fields e.g. createdAt
        newAction.updateForBulkWriteOperation();
        newActionService.generateAndSetActionPolicies((NewPage) defaultContext, newAction);

        // create or update default resources for the action
        // values already set to defaultResources are kept unchanged
        DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(newAction, importingMetaDTO.getBranchName());

        // generate gitSyncId if it's not present
        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getApplicationId() + "_" + new ObjectId());
        }
    }
}
