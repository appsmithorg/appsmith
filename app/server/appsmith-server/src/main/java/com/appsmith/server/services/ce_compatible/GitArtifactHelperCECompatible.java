package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.services.ce.GitArtifactHelperCE;

public interface GitArtifactHelperCECompatible<T extends ExportableArtifact> extends GitArtifactHelperCE<T> {
}
