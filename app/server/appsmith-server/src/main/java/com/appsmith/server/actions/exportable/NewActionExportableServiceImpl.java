package com.appsmith.server.actions.exportable;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class NewActionExportableServiceImpl extends NewActionExportableServiceCEImpl
        implements ExportableService<Action> {
    public NewActionExportableServiceImpl(
            ActionPermission actionPermission,
            ArtifactBasedExportableService<Action, Application> applicationExportableService) {
        super(actionPermission, applicationExportableService);
    }
}
