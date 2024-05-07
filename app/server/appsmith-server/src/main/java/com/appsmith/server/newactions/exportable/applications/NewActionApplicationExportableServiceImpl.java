package com.appsmith.server.newactions.exportable.applications;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Service;

@Service
public class NewActionApplicationExportableServiceImpl extends NewActionApplicationExportableServiceCEImpl
        implements ArtifactBasedExportableService<NewAction, Application> {
    public NewActionApplicationExportableServiceImpl(NewActionService newActionService) {
        super(newActionService);
    }
}
