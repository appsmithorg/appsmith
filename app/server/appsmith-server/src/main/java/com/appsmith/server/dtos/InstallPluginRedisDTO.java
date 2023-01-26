package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InstallPluginRedisDTO {
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    PluginWorkspaceDTO pluginWorkspaceDTO;
}
