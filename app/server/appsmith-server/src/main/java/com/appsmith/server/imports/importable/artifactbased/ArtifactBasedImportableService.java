package com.appsmith.server.imports.importable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Artifact;

public interface ArtifactBasedImportableService<T extends BaseDomain, U extends Artifact>
        extends ArtifactBasedImportableServiceCE<T, U> {}
