package com.appsmith.server.exports.internal;

import com.appsmith.server.domains.TransactionalArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;

public interface ContextBasedExportService<T extends TransactionalArtifact, U extends ArtifactExchangeJson>
        extends ContextBasedExportServiceCE<T, U> {}
