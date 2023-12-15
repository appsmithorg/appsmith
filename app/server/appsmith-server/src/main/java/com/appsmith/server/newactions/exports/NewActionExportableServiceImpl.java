package com.appsmith.server.newactions.exports;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class NewActionExportableServiceImpl extends NewActionExportableServiceCEImpl
        implements ExportableService<NewAction> {

    public NewActionExportableServiceImpl(NewActionService newActionService, ActionPermission actionPermission) {
        super(newActionService, actionPermission);
    }
}
