package com.appsmith.server.dtos;

import com.appsmith.server.domains.Plugin;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RemotePluginOrgDTO {

    Plugin plugin;

    String organizationId;

}
