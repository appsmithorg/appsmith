package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginDTO {
    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    PluginType type;

    @JsonView(Views.Api.class)
    String executorClass;

    @JsonView(Views.Api.class)
    String jarLocation;
}
