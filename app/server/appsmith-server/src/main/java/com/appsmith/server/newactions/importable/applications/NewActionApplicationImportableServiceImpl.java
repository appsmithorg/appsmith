package com.appsmith.server.newactions.importable.applications;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import org.springframework.stereotype.Service;

@Service
public class NewActionApplicationImportableServiceImpl extends NewActionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableService<NewAction, Application> {
    public NewActionApplicationImportableServiceImpl(
            NewActionRepository repository, NewActionService newActionService) {
        super(repository, newActionService);
    }
}
