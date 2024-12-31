package com.appsmith.external.git.constants.ce;

public enum RefType {
    BRANCH,
    TAG;

    public String lowerCaseName() {
        return this.name().toLowerCase();
    }
}
