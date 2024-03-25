package com.appsmith.server.newactions.importable;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Service;

@Service
public class NewActionImportableServiceImpl extends NewActionImportableServiceCEImpl
        implements ImportableService<NewAction> {

    public NewActionImportableServiceImpl(
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ArtifactBasedImportableService<NewAction, Application> applicationImportableService) {
        super(newActionService, actionCollectionService, applicationImportableService);
    }
}
