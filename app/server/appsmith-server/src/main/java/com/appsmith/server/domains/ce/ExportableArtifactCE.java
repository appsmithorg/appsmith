package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.GitArtifactMetadata;

public interface ExportableArtifactCE {

    String getId();

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    GitArtifactMetadata getGitArtifactMetadata();

    String getUnpublishedThemeId();

    String getPublishedThemeId();

    void makePristine();

    void sanitiseToExportDBObject();
}
