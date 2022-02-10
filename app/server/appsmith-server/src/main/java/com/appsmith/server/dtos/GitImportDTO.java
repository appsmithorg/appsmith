package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GitImportDTO {
    Application application;

    List<Datasource> unConfiguredDatasourceList;

    Boolean isPartialImport;
}
