package com.appsmith.server.dtos;

import com.appsmith.server.domains.Plugin;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class RemotePluginWorkspaceDTO {

    Plugin plugin;

    String organizationId;

}
