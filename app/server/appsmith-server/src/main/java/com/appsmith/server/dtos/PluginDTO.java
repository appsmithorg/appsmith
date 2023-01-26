package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginDTO {
    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    PluginType type;

    @JsonView(Views.Public.class)
    String executorClass;

    @JsonView(Views.Public.class)
    String jarLocation;
}
