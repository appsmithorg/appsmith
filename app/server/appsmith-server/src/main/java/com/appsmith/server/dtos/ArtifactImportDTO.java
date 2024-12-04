package com.appsmith.server.dtos;

import com.appsmith.server.domains.Artifact;

public abstract class ArtifactImportDTO {

    public abstract Artifact getArtifact();

    public abstract void setArtifact(Artifact artifact);
}
