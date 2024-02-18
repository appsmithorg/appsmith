package com.appsmith.server.actions.importable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionRepository;
import org.springframework.stereotype.Service;

@Service
public class NewActionApplicationImportableServiceImpl extends NewActionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableService<Action, Application> {

    public NewActionApplicationImportableServiceImpl(
            ActionRepository repository,
            DefaultResourcesService<Action> defaultResourcesService,
            DefaultResourcesService<ActionDTO> dtoDefaultResourcesService,
            ActionService actionService) {
        super(repository, defaultResourcesService, dtoDefaultResourcesService, actionService);
    }
}
