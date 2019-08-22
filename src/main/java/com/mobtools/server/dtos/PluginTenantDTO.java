package com.mobtools.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginTenantDTO {
    String name;
    TenantPluginStatus status;
}
