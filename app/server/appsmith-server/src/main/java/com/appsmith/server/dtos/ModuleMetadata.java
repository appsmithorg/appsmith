package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class ModuleMetadata {
    String moduleId;
    String datasourceId;
    PluginType pluginType;
    String pluginId;
}
