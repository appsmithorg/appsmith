package com.appsmith.server.dtos;

import com.appsmith.server.domains.PluginType;
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
