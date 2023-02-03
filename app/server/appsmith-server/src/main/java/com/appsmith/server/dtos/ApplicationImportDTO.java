package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationImportDTO {
    @JsonView(Views.Public.class)
    Application application;

    @JsonView(Views.Public.class)
    List<Datasource> unConfiguredDatasourceList;

    @JsonView(Views.Public.class)
    Boolean isPartialImport;
}
