package com.appsmith.server.dtos;

import com.appsmith.server.domains.PluginType;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class DslActionDTO {
    String id;
    String name;
    PluginType pluginType;
    Set<String> jsonPathKeys;
}
