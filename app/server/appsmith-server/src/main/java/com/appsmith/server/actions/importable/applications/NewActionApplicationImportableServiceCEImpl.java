package com.appsmith.server.actions.importable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableServiceCE;
import com.appsmith.server.repositories.ActionRepository;
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
        implements ArtifactBasedImportableServiceCE<Action, Application> {

    private final ActionRepository repository;
    private final DefaultResourcesService<Action> defaultResourcesService;
    private final DefaultResourcesService<ActionDTO> dtoDefaultResourcesService;
    private final ActionService actionService;

    @Override
    public List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> ((NewPage) context).getUnpublishedPage().getName())
                .toList();
    }

    @Override
    public void renameContextInImportableResources(
            List<Action> actionList, String oldContextName, String newContextName) {
        for (Action action : actionList) {
            if (action.getUnpublishedAction().getPageId().equals(oldContextName)) {
                action.getUnpublishedAction().setPageId(newContextName);
            }
        }
    }

    @Override
    public Flux<Action> getExistingResourcesInCurrentArtifactFlux(ImportableArtifact artifact) {
        return repository.findByApplicationId(artifact.getId());
    }

    @Override
    public Flux<Action> getExistingResourcesInOtherBranchesFlux(String defaultArtifactId, String currentArtifactId) {
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
            ImportableArtifact artifact,
            Action branchedAction,
            Action action) {
        action.setApplicationId(artifact.getId());

        if (artifact.getGitArtifactMetadata() != null) {
            if (branchedAction != null) {
                defaultResourcesService.setFromOtherBranch(action, branchedAction, importingMetaDTO.getBranchName());
                dtoDefaultResourcesService.setFromOtherBranch(
                        action.getUnpublishedAction(),
                        branchedAction.getUnpublishedAction(),
                        importingMetaDTO.getBranchName());
            } else {
                // This is the first action we are saving with given gitSyncId
                // in this instance
                DefaultResources defaultResources = new DefaultResources();
                defaultResources.setApplicationId(
                        artifact.getGitArtifactMetadata().getDefaultArtifactId());
                defaultResources.setActionId(action.getId());
                defaultResources.setBranchName(importingMetaDTO.getBranchName());
                action.setDefaultResources(defaultResources);
            }
        } else {
            DefaultResources defaultResources = new DefaultResources();
            defaultResources.setApplicationId(artifact.getId());
            defaultResources.setActionId(action.getId());
            action.setDefaultResources(defaultResources);
        }
    }

    @Override
    public void createNewResource(ImportingMetaDTO importingMetaDTO, Action action, Context defaultContext) {
        if (!importingMetaDTO.getPermissionProvider().canCreateAction((NewPage) defaultContext)) {
            throw new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, ((NewPage) defaultContext).getId());
        }

        // this will generate the id and other auto generated fields e.g. createdAt
        action.updateForBulkWriteOperation();
        actionService.generateAndSetActionPolicies((NewPage) defaultContext, action);

        // create or update default resources for the action
        // values already set to defaultResources are kept unchanged
        DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(action, importingMetaDTO.getBranchName());

        // generate gitSyncId if it's not present
        if (action.getGitSyncId() == null) {
            action.setGitSyncId(action.getApplicationId() + "_" + new ObjectId());
        }
    }
}
