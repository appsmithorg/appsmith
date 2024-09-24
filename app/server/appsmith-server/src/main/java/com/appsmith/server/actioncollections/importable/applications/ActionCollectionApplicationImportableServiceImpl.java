package com.appsmith.server.actioncollections.importable.applications;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionApplicationImportableServiceImpl extends ActionCollectionApplicationImportableServiceCEImpl
        implements ArtifactBasedImportableService<ActionCollection, Application> {
    public ActionCollectionApplicationImportableServiceImpl(
            ActionCollectionRepository repository, ActionCollectionService actionCollectionService) {
        super(repository, actionCollectionService);
    }
}
