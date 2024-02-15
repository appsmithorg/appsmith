package com.appsmith.server.domains.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.fasterxml.jackson.annotation.JsonView;

public interface ExportableArtifactCE {

    String getId();

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    GitArtifactMetadata getGitArtifactMetadata();

    @JsonView(Views.Internal.class)
    default String getUnpublishedThemeId() {
        return null;
    }

    @JsonView(Views.Internal.class)
    default String getPublishedThemeId() {
        return null;
    }

    void makePristine();

    void sanitiseToExportDBObject();
}
