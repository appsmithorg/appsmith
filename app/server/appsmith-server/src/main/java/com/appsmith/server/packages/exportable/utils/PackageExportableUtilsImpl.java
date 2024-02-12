package com.appsmith.server.packages.exportable.utils;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Package;
import com.appsmith.server.exports.exportable.artifactbased.utils.ArtifactBasedExportableUtils;
import org.springframework.stereotype.Service;

@Service
public class PackageExportableUtilsImpl implements ArtifactBasedExportableUtils<Package> {
    @Override
    public String getContextListPath() {
        return FieldName.MODULE_LIST;
    }
}
