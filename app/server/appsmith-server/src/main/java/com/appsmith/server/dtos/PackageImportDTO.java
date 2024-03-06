package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Package;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PackageImportDTO extends ArtifactImportDTO {

    @JsonProperty("package")
    Package aPackage;

    List<Datasource> unConfiguredDatasourceList;

    Boolean isPartialImport;
}
