package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import lombok.Data;

@Data
public class PluginTypeAndCountDTO {
    private PluginType pluginType;
    private Integer count;
}
