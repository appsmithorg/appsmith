package com.appsmith.server.newactions.importable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import static java.lang.Boolean.TRUE;

@Service
public class NewActionApplicationImportableServiceImpl extends NewActionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableService<NewAction, Application> {

    public NewActionApplicationImportableServiceImpl(
            NewActionRepository repository,
            DefaultResourcesService<NewAction> defaultResourcesService,
            DefaultResourcesService<ActionDTO> dtoDefaultResourcesService,
            NewActionService newActionService) {
        super(repository, defaultResourcesService, dtoDefaultResourcesService, newActionService);
    }

    @Override
    public Flux<NewAction> getExistingResourcesInCurrentArtifactFlux(ImportableArtifact artifact) {
        return super.getExistingResourcesInCurrentArtifactFlux(artifact)
                .filter(newAction ->
                        newAction.getRootModuleInstanceId() == null || TRUE.equals(newAction.getIsPublic()));
    }

    @Override
    public Flux<NewAction> getExistingResourcesInOtherBranchesFlux(String defaultArtifactId, String currentArtifactId) {
        return super.getExistingResourcesInOtherBranchesFlux(defaultArtifactId, currentArtifactId)
                .filter(newAction ->
                        newAction.getRootModuleInstanceId() == null || TRUE.equals(newAction.getIsPublic()));
    }
}
