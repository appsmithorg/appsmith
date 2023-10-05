package com.appsmith.server.dtos;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.server.domains.ScreenType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class LayoutDTO {

    private String id;

    ScreenType screen;

    JSONObject dsl;

    List<Set<DslExecutableDTO>> layoutOnLoadActions;

    // this attribute will be used to display errors caused white calculating allOnLoadExecutable
    // PageLoadExcutablesUtilCEImpl.java
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    List<ErrorDTO> layoutOnLoadActionErrors;

    // All the executables which have been updated as part of updateLayout function call
    List<LayoutExecutableUpdateDTO> actionUpdates;

    // All the toast messages that the developer user should be displayed to inform about the consequences of update
    // layout.
    List<String> messages;

    public Set<String> userPermissions = new HashSet<>();
}
