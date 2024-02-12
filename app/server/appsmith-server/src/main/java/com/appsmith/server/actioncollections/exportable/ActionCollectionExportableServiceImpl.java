package com.appsmith.server.actioncollections.exportable;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionExportableServiceImpl extends ActionCollectionExportableServiceCEImpl
        implements ExportableService<ActionCollection> {
    public ActionCollectionExportableServiceImpl(
            ActionPermission actionPermission,
            ArtifactBasedExportableService<ActionCollection, Application> applicationExportableService) {
        super(actionPermission, applicationExportableService);
    }
}
