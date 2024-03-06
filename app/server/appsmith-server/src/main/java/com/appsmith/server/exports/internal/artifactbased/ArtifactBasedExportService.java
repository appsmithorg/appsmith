package com.appsmith.server.exports.internal.artifactbased;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;

public interface ArtifactBasedExportService<T extends Artifact, U extends ArtifactExchangeJson>
        extends ArtifactBasedExportServiceCE<T, U> {}
