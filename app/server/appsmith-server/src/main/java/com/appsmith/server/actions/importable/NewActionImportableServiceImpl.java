package com.appsmith.server.actions.importable;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import org.springframework.stereotype.Service;

@Service
public class NewActionImportableServiceImpl extends NewActionImportableServiceCEImpl
        implements ImportableService<Action> {

    public NewActionImportableServiceImpl(
            ActionService actionService,
            ActionCollectionService actionCollectionService,
            ArtifactBasedImportableService<Action, Application> applicationImportableService) {
        super(actionService, actionCollectionService, applicationImportableService);
    }
}
