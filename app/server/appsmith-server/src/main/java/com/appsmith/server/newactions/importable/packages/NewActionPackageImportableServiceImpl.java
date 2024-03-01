package com.appsmith.server.newactions.importable.packages;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class NewActionPackageImportableServiceImpl implements ArtifactBasedImportableService<NewAction, Package> {

    private final NewActionRepository repository;
    private final NewActionService newActionService;
    private final DefaultResourcesService<NewAction> defaultResourcesService;
    private final DefaultResourcesService<ActionDTO> dtoDefaultResourcesService;

    @Override
    public List<String> getImportedContextNames(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> ((Module) context).getUnpublishedModule().getName())
                .toList();
    }

    @Override
    public void renameContextInImportableResources(
            List<NewAction> newActionList, String oldContextName, String newContextName) {
        for (NewAction newAction : newActionList) {
            if (newAction.getUnpublishedAction().getModuleId().equals(oldContextName)) {
                newAction.getPublishedAction().setModuleId(newContextName);
            }
        }
    }

    @Override
    public Flux<NewAction> getExistingResourcesInCurrentArtifactFlux(Artifact artifact) {
        return repository.findByPackageId(artifact.getId());
    }

    @Override
    public Flux<NewAction> getExistingResourcesInOtherBranchesFlux(String defaultArtifactId, String currentArtifactId) {
        // TODO add after git support
        return Flux.empty();
    }

    @Override
    public Context updateContextInResource(
            Object dtoObject, Map<String, ? extends Context> contextMap, String fallbackDefaultContextId) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;

        if (StringUtils.isEmpty(actionDTO.getModuleId())) {
            actionDTO.setModuleId(fallbackDefaultContextId);
        }

        Module defaultModule = (Module) contextMap.get(actionDTO.getModuleId());

        if (defaultModule == null) {
            return null;
        }
        actionDTO.setModuleId(defaultModule.getId());

        return defaultModule;
    }

    @Override
    public void populateDefaultResources(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Artifact artifact,
            NewAction branchedNewAction,
            NewAction newAction) {
        newAction.setPackageId(artifact.getId());
    }

    @Override
    public void createNewResource(ImportingMetaDTO importingMetaDTO, NewAction newAction, Context defaultContext) {
        // TODO uncomment after permission provider has been split
        //        if (!importingMetaDTO.getPermissionProvider().canCreateAction((Module) defaultContext)) {
        //            throw new AppsmithException(
        //                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE, ((Module) defaultContext).getId());
        //        }

        // this will generate the id and other auto generated fields e.g. createdAt
        newAction.updateForBulkWriteOperation();
        newActionService.generateAndSetActionPolicies((Module) defaultContext, newAction);

        defaultResourcesService.initialize(newAction, importingMetaDTO.getBranchName(), false);
        dtoDefaultResourcesService.initialize(
                newAction.getUnpublishedAction(), importingMetaDTO.getBranchName(), false);

        // generate gitSyncId if it's not present
        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getPackageId() + "_" + new ObjectId());
        }
    }
}
