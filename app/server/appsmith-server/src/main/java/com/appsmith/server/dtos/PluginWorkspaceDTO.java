package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PluginWorkspaceDTO {

    @JsonView(Views.Api.class)
    String pluginId;

    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    WorkspacePluginStatus status;
}
