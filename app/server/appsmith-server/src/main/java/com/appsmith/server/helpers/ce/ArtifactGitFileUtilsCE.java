package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.ArtifactGitReference;
import com.appsmith.server.dtos.ArtifactExchangeJson;

import java.util.Map;

public interface ArtifactGitFileUtilsCE<T extends ArtifactGitReference> {

    T createArtifactReferenceObject();

    void addArtifactReferenceFromExportedJson(
            ArtifactExchangeJson artifactExchangeJson, ArtifactGitReference artifactGitReference);

    Map<String, String> getConstantsMap();
}
