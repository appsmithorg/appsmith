package com.appsmith.server.imports.internal.artifactbased;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;

public interface ArtifactBasedImportService<
                T extends ImportableArtifact, U extends ImportableArtifactDTO, V extends ArtifactExchangeJson>
        extends ArtifactBasedImportServiceCE<T, U, V> {}
