package com.appsmith.server.domains;

import com.appsmith.server.dtos.OrganizationPluginStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationPlugin extends BaseDomain {

    String pluginId;

    OrganizationPluginStatus status;

}
