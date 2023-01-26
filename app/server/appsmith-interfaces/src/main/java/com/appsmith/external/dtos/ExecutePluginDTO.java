package com.appsmith.external.dtos;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExecutePluginDTO {
    @JsonView(Views.Public.class)
    String installationKey;

    @JsonView(Views.Public.class)
    String pluginName;

    @JsonView(Views.Public.class)
    String pluginVersion;

    @JsonView(Views.Public.class)
    String actionTemplateName;

    @JsonView(Views.Public.class)
    String datasourceTemplateName;

    @JsonView(Views.Public.class)
    DatasourceDTO datasource;

    @JsonView(Views.Public.class)
    ActionConfiguration actionConfiguration;

    @JsonView(Views.Public.class)
    ExecuteActionDTO executeActionDTO;
}
