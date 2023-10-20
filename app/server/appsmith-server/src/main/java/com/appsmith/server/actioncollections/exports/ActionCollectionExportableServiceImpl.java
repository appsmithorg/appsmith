package com.appsmith.server.actioncollections.exports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionExportableServiceImpl extends ActionCollectionExportableServiceCEImpl
        implements ExportableService<ActionCollection> {
    public ActionCollectionExportableServiceImpl(
            ActionCollectionService actionCollectionService, ActionPermission actionPermission) {
        super(actionCollectionService, actionPermission);
    }
}
