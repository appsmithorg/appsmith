package com.appsmith.server.dtos;

import com.appsmith.server.domains.PluginType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class DslActionDTO {
    String id;
    @JsonIgnore
    String defaultActionId;
    String name;
    String collectionId;
    Boolean clientSideExecution;
    PluginType pluginType;
    Set<String> jsonPathKeys;
    Integer timeoutInMillisecond = DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;
}
