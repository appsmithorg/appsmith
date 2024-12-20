package com.appsmith.server.git;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import org.junit.jupiter.api.extension.ExtensionContext;

public interface ArtifactBuilderContext extends ExtensionContext {

    ArtifactType getArtifactType();

    Class<? extends ArtifactExchangeJson> getArtifactJsonType();

    String getArtifactJsonPath();

    String getWorkspaceId();

    void setWorkspaceId(String workspaceId);

    String getArtifactId();

    void setArtifactId(String artifactId);
}
