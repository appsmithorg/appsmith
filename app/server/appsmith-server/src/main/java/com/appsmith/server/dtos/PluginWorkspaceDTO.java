package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginWorkspaceDTO {

    String pluginId;

    String organizationId;

    WorkspacePluginStatus status;
}
