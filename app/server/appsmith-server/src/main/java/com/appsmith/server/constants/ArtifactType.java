package com.appsmith.server.constants;

/**
 * The type of Json which the system deals with, it could be application, packages, or workflows.
 * Collectively called Artifact
 */
public enum ArtifactType {
    APPLICATION,
    PACKAGE,
    WORKFLOW;

    public String lowerCaseName() {
        return this.name().toLowerCase();
    }
}
