package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.services.ce.GitArtifactHelperCE;

public interface GitArtifactHelperCECompatible<T extends Artifact> extends GitArtifactHelperCE<T> {}
