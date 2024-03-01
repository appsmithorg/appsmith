package com.appsmith.server.imports.internal.artifactbased;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;

public interface ArtifactBasedImportService<
                T extends Artifact, U extends ImportableArtifactDTO, V extends ArtifactExchangeJson>
        extends ArtifactBasedImportServiceCE<T, U, V> {}
