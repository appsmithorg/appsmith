package com.appsmith.server.domains.ce;

public interface ExportableArtifactCE {

    String getId();

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    void makePristine();

    void sanitiseToExportDBObject();
}
