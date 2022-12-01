package com.appsmith.server.dtos;

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

    String pluginId;

    String workspaceId;

    WorkspacePluginStatus status;
}
