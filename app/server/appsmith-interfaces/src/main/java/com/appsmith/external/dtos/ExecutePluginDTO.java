package com.appsmith.external.dtos;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExecutePluginDTO {
    @JsonView(Views.Api.class)
    String installationKey;

    @JsonView(Views.Api.class)
    String pluginName;

    @JsonView(Views.Api.class)
    String pluginVersion;

    @JsonView(Views.Api.class)
    String actionTemplateName;

    @JsonView(Views.Api.class)
    String datasourceTemplateName;

    @JsonView(Views.Api.class)
    DatasourceDTO datasource;

    @JsonView(Views.Api.class)
    ActionConfiguration actionConfiguration;

    @JsonView(Views.Api.class)
    ExecuteActionDTO executeActionDTO;
}
