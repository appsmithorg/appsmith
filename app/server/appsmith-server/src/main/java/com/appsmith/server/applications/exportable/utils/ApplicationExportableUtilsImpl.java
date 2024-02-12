package com.appsmith.server.applications.exportable.utils;

import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.artifactbased.utils.ArtifactBasedExportableUtils;
import org.springframework.stereotype.Service;

@Service
public class ApplicationExportableUtilsImpl extends ApplicationExportableUtilsCEImpl
        implements ArtifactBasedExportableUtils<Application> {}
