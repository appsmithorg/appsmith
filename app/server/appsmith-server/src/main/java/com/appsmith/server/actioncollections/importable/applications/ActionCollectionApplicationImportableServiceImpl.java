package com.appsmith.server.actioncollections.importable.applications;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import static java.lang.Boolean.TRUE;

@Service
public class ActionCollectionApplicationImportableServiceImpl extends ActionCollectionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableService<ActionCollection, Application> {

    public ActionCollectionApplicationImportableServiceImpl(
            ActionCollectionRepository repository,
            DefaultResourcesService<ActionCollection> defaultResourcesService,
            DefaultResourcesService<ActionCollectionDTO> dtoDefaultResourcesService,
            ActionCollectionService actionCollectionService) {
        super(repository, defaultResourcesService, dtoDefaultResourcesService, actionCollectionService);
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInCurrentArtifactFlux(Artifact artifact) {
        return super.getExistingResourcesInCurrentArtifactFlux(artifact)
                .filter(actionCollection -> actionCollection.getRootModuleInstanceId() == null
                        || TRUE.equals(actionCollection.getIsPublic()));
    }

    @Override
    public Flux<ActionCollection> getExistingResourcesInOtherBranchesFlux(
            String defaultArtifactId, String currentArtifactId) {
        return super.getExistingResourcesInOtherBranchesFlux(defaultArtifactId, currentArtifactId)
                .filter(actionCollection -> actionCollection.getRootModuleInstanceId() == null
                        || TRUE.equals(actionCollection.getIsPublic()));
    }
}
