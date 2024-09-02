package com.appsmith.server.domains.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.GitArtifactMetadata;

public interface ArtifactCE {

    String getId();

    default String getBaseId() {
        return getId();
    }

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    GitArtifactMetadata getGitArtifactMetadata();

    void setGitArtifactMetadata(GitArtifactMetadata gitArtifactMetadata);

    default String getUnpublishedThemeId() {
        return null;
    }

    default String getPublishedThemeId() {
        return null;
    }

    void makePristine();

    void sanitiseToExportDBObject();

    default void setUnpublishedThemeId(String themeId) {}

    default void setPublishedThemeId(String themeId) {}

    ArtifactType getArtifactType();
}
