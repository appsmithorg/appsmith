package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InstallPluginRedisDTO {
    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    PluginWorkspaceDTO pluginWorkspaceDTO;
}
