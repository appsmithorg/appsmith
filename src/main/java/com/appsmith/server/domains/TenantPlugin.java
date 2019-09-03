package com.appsmith.server.domains;

import com.appsmith.server.dtos.TenantPluginStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class TenantPlugin extends BaseDomain {

    private String pluginId;

    TenantPluginStatus status;

}
