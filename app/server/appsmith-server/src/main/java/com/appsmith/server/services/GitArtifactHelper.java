package com.appsmith.server.services;

import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.services.ce_compatible.GitArtifactHelperCECompatible;

// TODO we can change this to ArtifactGitHelper
public interface GitArtifactHelper<T extends ExportableArtifact> extends GitArtifactHelperCECompatible<T> {}
