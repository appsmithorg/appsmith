package com.appsmith.server.exports.internal;

import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;

public interface ContextBasedExportService<T extends ExportableArtifact, U extends ArtifactExchangeJson>
        extends ContextBasedExportServiceCE<T, U> {}
