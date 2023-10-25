package com.appsmith.server.newactions.imports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import org.springframework.stereotype.Service;

@Service
public class NewActionImportableServiceImpl extends NewActionImportableServiceCEImpl
        implements ImportableService<NewAction> {
    public NewActionImportableServiceImpl(
            NewActionService newActionService,
            NewActionRepository repository,
            ActionCollectionService actionCollectionService) {
        super(newActionService, repository, actionCollectionService);
    }
}
