package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataSet {

    @JsonView(Views.Public.class)
    String pluginType;

    @JsonView(Views.Public.class)
    String packageName;

    @JsonView(Views.Public.class)
    String description;

    @JsonView(Views.Public.class)
    String name;
}
