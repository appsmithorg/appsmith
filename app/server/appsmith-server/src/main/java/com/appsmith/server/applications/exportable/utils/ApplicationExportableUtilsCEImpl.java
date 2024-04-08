package com.appsmith.server.applications.exportable.utils;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.exportable.artifactbased.utils.ArtifactBasedExportableUtilsCE;
import org.springframework.stereotype.Service;

@Service
public class ApplicationExportableUtilsCEImpl implements ArtifactBasedExportableUtilsCE<Application> {
    @Override
    public String getContextListPath() {
        return FieldName.PAGE_LIST;
    }
}
