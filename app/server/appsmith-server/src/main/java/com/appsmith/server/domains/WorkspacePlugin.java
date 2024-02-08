package com.appsmith.server.domains;

import com.appsmith.server.dtos.WorkspacePluginStatus;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class WorkspacePlugin {

    String pluginId;

    WorkspacePluginStatus status;
}
