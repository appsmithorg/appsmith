package com.appsmith.server.actioncollections.exportable.applications;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionApplicationExportableServiceImpl extends ActionCollectionApplicationExportableServiceCEImpl
        implements ArtifactBasedExportableService<ActionCollection, Application> {
    public ActionCollectionApplicationExportableServiceImpl(ActionCollectionService actionCollectionService) {
        super(actionCollectionService);
    }
}
