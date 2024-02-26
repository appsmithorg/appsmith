package com.appsmith.server.actioncollections.importable;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {

    public ActionCollectionImportableServiceImpl(
            ActionCollectionRepository repository,
            ArtifactBasedImportableService<ActionCollection, Application> applicationImportableService) {
        super(repository, applicationImportableService);
    }
}
