package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataSet {

    @JsonView(Views.Api.class)
    String pluginType;

    @JsonView(Views.Api.class)
    String packageName;

    @JsonView(Views.Api.class)
    String description;

    @JsonView(Views.Api.class)
    String name;
}
