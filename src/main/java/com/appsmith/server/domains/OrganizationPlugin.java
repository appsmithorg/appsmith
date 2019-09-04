package com.appsmith.server.domains;

import com.appsmith.server.dtos.OrganizationPluginStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationPlugin extends BaseDomain {

    private String pluginId;

    OrganizationPluginStatus status;

}
