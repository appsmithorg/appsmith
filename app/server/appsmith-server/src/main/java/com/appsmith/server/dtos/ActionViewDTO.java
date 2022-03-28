package com.appsmith.server.dtos;

import com.appsmith.external.models.DefaultResources;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    String id;
    String name;
    String pageId;
    Integer timeoutInMillisecond;
    Boolean confirmBeforeExecute;
    Set<String> jsonPathKeys;
    @JsonIgnore
    DefaultResources defaultResources;

    // Overriding the getter to ensure that for actions missing action configuration, the timeout is
    // still set for the client to use as a guideline (even though this would be an invalid action
    // and hence would return an action execution error.
    public Integer getTimeoutInMillisecond() {
        return (timeoutInMillisecond == null || timeoutInMillisecond <= 0) ?
                DEFAULT_ACTION_EXECUTION_TIMEOUT_MS : timeoutInMillisecond;
    }
}
