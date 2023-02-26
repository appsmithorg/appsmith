package com.appsmith.server.dtos;

import com.appsmith.server.domains.ScreenType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;
import com.appsmith.external.exceptions.ErrorDTO;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
public class LayoutDTO {

    private String id;

    ScreenType screen;

    JSONObject dsl;

    List<Set<DslActionDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadAction PageLoadActionsUtilCEImpl.java
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    List<ErrorDTO> layoutOnLoadActionErrors;

    // All the actions which have been updated as part of updateLayout function call
    List<LayoutActionUpdateDTO> actionUpdates;

    // All the toast messages that the developer user should be displayed to inform about the consequences of update layout.
    List<String> messages;

    public Set<String> userPermissions = new HashSet<>();
}
