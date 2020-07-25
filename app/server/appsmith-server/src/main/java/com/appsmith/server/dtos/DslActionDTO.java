package com.appsmith.server.dtos;

import com.appsmith.server.domains.PluginType;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

@Getter
@Setter
@EqualsAndHashCode
public class DslActionDTO {
    String id;
    String name;
    PluginType pluginType;
    Set<String> jsonPathKeys;
    Integer timeoutInMillisecond = DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;
}
