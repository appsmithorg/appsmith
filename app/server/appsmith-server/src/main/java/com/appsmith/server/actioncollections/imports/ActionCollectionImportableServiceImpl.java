package com.appsmith.server.actioncollections.imports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionImportableServiceImpl extends ActionCollectionImportableServiceCEImpl
        implements ImportableService<ActionCollection> {
    public ActionCollectionImportableServiceImpl(
            ActionCollectionService actionCollectionService, ActionCollectionRepository repository) {
        super(actionCollectionService, repository);
    }
}
