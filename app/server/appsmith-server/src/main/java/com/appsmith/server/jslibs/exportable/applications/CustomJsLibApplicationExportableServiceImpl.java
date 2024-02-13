package com.appsmith.server.jslibs.exportable.applications;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;

@Service
public class CustomJsLibApplicationExportableServiceImpl extends CustomJsLibApplicationExportableServiceCEImpl
        implements ArtifactBasedExportableService<CustomJSLib, Application> {
    public CustomJsLibApplicationExportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
    }
}
