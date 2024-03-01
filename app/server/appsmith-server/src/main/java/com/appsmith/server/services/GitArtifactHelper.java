package com.appsmith.server.services;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.services.ce_compatible.GitArtifactHelperCECompatible;

// TODO we can change this to ArtifactGitHelper
public interface GitArtifactHelper<T extends Artifact> extends GitArtifactHelperCECompatible<T> {}
