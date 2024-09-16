package com.appsmith.server.domains;

public interface Context {

    String getId();

    String getArtifactId();

    Layout getLayout();

    String getBranchName();

    String getUnpublishedName();
}
