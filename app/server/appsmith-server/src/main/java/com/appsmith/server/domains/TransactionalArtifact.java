package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.TransactionalArtifactCE;

public interface TransactionalArtifact extends TransactionalArtifactCE {

    String getId();

    String getName();

    String getWorkspaceId();

    Boolean getExportWithConfiguration();

    void setExportWithConfiguration(Boolean bool);

    void makePristine();

    void sanitiseToExportDBObject();
}
