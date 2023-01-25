package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

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
    @JsonView(Views.Api.class)
    String id;

    @JsonView(Views.Internal.class)
    String defaultActionId;

    @JsonView(Views.Internal.class)
    String defaultCollectionId;

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String collectionId;

    @JsonView(Views.Api.class)
    Boolean clientSideExecution;

    @JsonView(Views.Api.class)
    Boolean confirmBeforeExecute;

    @JsonView(Views.Api.class)
    PluginType pluginType;

    @JsonView(Views.Api.class)
    Set<String> jsonPathKeys;

    @JsonView(Views.Api.class)
    Integer timeoutInMillisecond = DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

    public void sanitiseForExport() {
        this.setDefaultActionId(null);
        this.setDefaultCollectionId(null);
    }
}
