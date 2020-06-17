package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginOrgDTO {

    String pluginId;

    String organizationId;

    OrganizationPluginStatus status;
}
