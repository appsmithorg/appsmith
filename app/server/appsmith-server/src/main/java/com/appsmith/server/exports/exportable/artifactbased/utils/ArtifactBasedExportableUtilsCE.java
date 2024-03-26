package com.appsmith.server.exports.exportable.artifactbased.utils;

import com.appsmith.server.domains.ExportableArtifact;

public interface ArtifactBasedExportableUtilsCE<T extends ExportableArtifact> {

    String getContextListPath();
}
