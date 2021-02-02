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

    List<HashSet<DslActionDTO>> layoutOnLoadActions;

    List<LayoutActionUpdateDTO> actionUpdates;

    List<String> messages;

    public Set<String> userPermissions = new HashSet<>();
}
