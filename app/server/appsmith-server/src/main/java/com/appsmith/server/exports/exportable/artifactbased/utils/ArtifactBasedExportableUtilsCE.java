package com.appsmith.server.exports.exportable.artifactbased.utils;

import com.appsmith.server.domains.Artifact;

public interface ArtifactBasedExportableUtilsCE<T extends Artifact> {

    String getContextListPath();
}
