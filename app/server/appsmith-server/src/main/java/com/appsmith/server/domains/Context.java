package com.appsmith.server.domains;

import com.appsmith.external.git.constants.ce.RefType;

public interface Context {

    String getId();

    String getArtifactId();

    Layout getLayout();

    RefType getRefType();

    String getRefName();

    String getUnpublishedName();
}
