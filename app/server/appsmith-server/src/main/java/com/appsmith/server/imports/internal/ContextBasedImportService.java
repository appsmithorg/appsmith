package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ImportableArtifactDTO;
import com.appsmith.server.dtos.ImportableArtifactJson;

public interface ContextBasedImportService<
                T extends ImportableArtifact, U extends ImportableArtifactDTO, V extends ImportableArtifactJson>
        extends ContextBasedImportServiceCE<T, U, V> {}
