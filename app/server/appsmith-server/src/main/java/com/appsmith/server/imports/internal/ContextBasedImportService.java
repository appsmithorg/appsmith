package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;

public interface ContextBasedImportService<
                T extends ImportableArtifact, U extends ImportableArtifactDTO, V extends ArtifactExchangeJson>
        extends ContextBasedImportServiceCE<T, U, V> {}
