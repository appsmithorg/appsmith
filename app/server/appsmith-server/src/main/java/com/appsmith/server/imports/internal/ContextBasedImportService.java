package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.dtos.ImportableArtifactJson;
import com.appsmith.server.dtos.ImportableContextDTO;

public interface ContextBasedImportService<
                T extends ImportableArtifact, U extends ImportableContextDTO, V extends ImportableArtifactJson>
        extends ContextBasedImportServiceCE<T, U, V> {}
