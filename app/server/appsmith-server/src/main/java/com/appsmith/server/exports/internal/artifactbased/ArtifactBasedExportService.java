package com.appsmith.server.exports.internal.artifactbased;

import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;

public interface ArtifactBasedExportService<T extends ExportableArtifact, U extends ArtifactExchangeJson>
        extends ArtifactBasedExportServiceCE<T, U> {}
