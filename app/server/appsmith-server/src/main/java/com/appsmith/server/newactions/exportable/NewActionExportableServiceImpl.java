package com.appsmith.server.newactions.exportable;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class NewActionExportableServiceImpl extends NewActionExportableServiceCEImpl
        implements ExportableService<NewAction> {
    public NewActionExportableServiceImpl(
            ActionPermission actionPermission,
            ArtifactBasedExportableService<NewAction, Application> applicationExportableService) {
        super(actionPermission, applicationExportableService);
    }
}
