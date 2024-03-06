package com.appsmith.server.constants;

/**
 * The type of Domain which the system deals with while exporting, importing, or version controlling.
 * It could be application, packages, or workflows.
 * Collectively called Artifact
 */
public enum ArtifactType {
    APPLICATION,
    PACKAGE,
    WORKFLOW
}
