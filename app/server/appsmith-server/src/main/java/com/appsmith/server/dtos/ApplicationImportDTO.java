package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationImportDTO extends ArtifactImportDTO {

    Application application;

    List<Datasource> unConfiguredDatasourceList;

    Boolean isPartialImport;

    @Override
    public Artifact getArtifact() {
        return this.getApplication();
    }

    @Override
    public void setArtifact(Artifact artifact) {
        this.setApplication((Application) artifact);
    }
}
