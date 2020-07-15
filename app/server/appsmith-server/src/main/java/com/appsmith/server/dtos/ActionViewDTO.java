package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

@Getter
@Setter
@NoArgsConstructor
public class ActionViewDTO {
    String id;
    String name;
    String pageId;
    Integer timeoutInMillisecond;
    Set<String> jsonPathKeys;

    // Overriding the getter to ensure that for actions missing action configuration, the timeout is
    // still set for the client to use as a guideline (even though this would be an invalid action
    // and hence would return an action execution error.
    public Integer getTimeoutInMillisecond() {
        return (timeoutInMillisecond == null || timeoutInMillisecond <= 0) ?
                DEFAULT_ACTION_EXECUTION_TIMEOUT_MS : timeoutInMillisecond;
    }
}
