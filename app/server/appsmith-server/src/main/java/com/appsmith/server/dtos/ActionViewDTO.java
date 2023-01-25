package com.appsmith.server.dtos;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionViewDTO {
    @JsonView(Views.Api.class)
    String id;

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    Integer timeoutInMillisecond;

    @JsonView(Views.Api.class)
    Boolean confirmBeforeExecute;

    @JsonView(Views.Api.class)
    Set<String> jsonPathKeys;

    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    // Overriding the getter to ensure that for actions missing action configuration, the timeout is
    // still set for the client to use as a guideline (even though this would be an invalid action
    // and hence would return an action execution error.
    @JsonView(Views.Api.class)
    public Integer getTimeoutInMillisecond() {
        return (timeoutInMillisecond == null || timeoutInMillisecond <= 0) ?
                DEFAULT_ACTION_EXECUTION_TIMEOUT_MS : timeoutInMillisecond;
    }
}
