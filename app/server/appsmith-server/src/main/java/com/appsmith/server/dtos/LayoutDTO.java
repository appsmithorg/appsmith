package com.appsmith.server.dtos;

import com.appsmith.server.domains.ScreenType;
import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class LayoutDTO {

    private String id;

    ScreenType screen;

    JSONObject dsl;

    List<Set<DslActionDTO>> layoutOnLoadActions;

    // All the actions which have been updated as part of updateLayout function call
    List<LayoutActionUpdateDTO> actionUpdates;

    // All the toast messages that the developer user should be displayed to inform about the consequences of update layout.
    List<String> messages;

    public Set<String> userPermissions = new HashSet<>();
}
