package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataSource {

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    String packageName;

}
