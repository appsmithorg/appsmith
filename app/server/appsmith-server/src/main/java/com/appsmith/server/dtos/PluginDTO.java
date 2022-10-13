package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PluginDTO {
    String name;
    PluginType type;
    String executorClass;
    String jarLocation;
}
