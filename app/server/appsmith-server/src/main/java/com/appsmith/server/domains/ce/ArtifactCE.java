package com.appsmith.server.domains.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.GitArtifactMetadata;

import java.util.Set;

public interface ArtifactCE {

    String getId();

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    GitArtifactMetadata getGitArtifactMetadata();

    String getUnpublishedThemeId();

    String getPublishedThemeId();

    void setUnpublishedThemeId(String themeId);

    void setPublishedThemeId(String themeId);

    Set<Policy> getPolicies();
}
