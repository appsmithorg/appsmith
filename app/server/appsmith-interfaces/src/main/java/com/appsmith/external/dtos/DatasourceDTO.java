package com.appsmith.external.dtos;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class DatasourceDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    DatasourceConfiguration datasourceConfiguration;
}
