package com.appsmith.server.actions.exportable.applications;

import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import org.springframework.stereotype.Service;

@Service
public class NewActionApplicationExportableServiceImpl extends NewActionApplicationExportableServiceCEImpl
        implements ArtifactBasedExportableService<Action, Application> {
    public NewActionApplicationExportableServiceImpl(ActionService actionService) {
        super(actionService);
    }
}
