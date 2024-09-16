package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
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
public class ActionViewCE_DTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String baseId;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    Integer timeoutInMillisecond;

    @JsonView(Views.Public.class)
    Boolean confirmBeforeExecute;

    @JsonView(Views.Public.class)
    Set<String> jsonPathKeys;

    // Overriding the getter to ensure that for actions missing action configuration, the timeout is
    // still set for the client to use as a guideline (even though this would be an invalid action
    // and hence would return an action execution error.
    @JsonView(Views.Public.class)
    public Integer getTimeoutInMillisecond() {
        return (timeoutInMillisecond == null || timeoutInMillisecond <= 0)
                ? DEFAULT_ACTION_EXECUTION_TIMEOUT_MS
                : timeoutInMillisecond;
    }
}
