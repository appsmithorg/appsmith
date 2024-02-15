package com.appsmith.server.imports.importable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.ImportableArtifact;

public interface ArtifactBasedImportableService<T extends BaseDomain, U extends ImportableArtifact>
        extends ArtifactBasedImportableServiceCE<T, U> {}
