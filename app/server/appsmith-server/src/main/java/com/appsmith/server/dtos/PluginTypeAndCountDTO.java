package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PluginTypeAndCountDTO {
    private PluginType pluginType;
    private Long count;
}
