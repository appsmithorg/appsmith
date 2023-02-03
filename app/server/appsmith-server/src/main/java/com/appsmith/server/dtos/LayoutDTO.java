package com.appsmith.server.dtos;

import com.appsmith.server.domains.ScreenType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.views.Views;

import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
public class LayoutDTO {

    @JsonView(Views.Public.class)
    private String id;

    @JsonView(Views.Public.class)
    ScreenType screen;

    @JsonView(Views.Public.class)
    JSONObject dsl;

    @JsonView(Views.Public.class)
    List<Set<DslActionDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadAction PageLoadActionsUtilCEImpl.java
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    List<ErrorDTO> layoutOnLoadActionErrors;

    // All the actions which have been updated as part of updateLayout function call
    @JsonView(Views.Public.class)
    List<LayoutActionUpdateDTO> actionUpdates;

    // All the toast messages that the developer user should be displayed to inform about the consequences of update layout.
    @JsonView(Views.Public.class)
    List<String> messages;

    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();
}
