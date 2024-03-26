package com.appsmith.server.exports.exportable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.exports.exportable.artifactbased.utils.ArtifactBasedExportableUtils;

public interface ArtifactBasedExportableService<T extends BaseDomain, U extends ExportableArtifact>
        extends ArtifactBasedExportableServiceCE<T, U>, ArtifactBasedExportableUtils<U> {}
