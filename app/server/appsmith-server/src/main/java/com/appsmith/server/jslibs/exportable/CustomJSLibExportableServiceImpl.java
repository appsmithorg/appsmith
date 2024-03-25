package com.appsmith.server.jslibs.exportable;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import org.springframework.stereotype.Service;

@Service
public class CustomJSLibExportableServiceImpl extends CustomJSLibExportableServiceCEImpl
        implements ExportableService<CustomJSLib> {
    public CustomJSLibExportableServiceImpl(
            ArtifactBasedExportableService<CustomJSLib, Application> applicationExportableService) {
        super(applicationExportableService);
    }
}
