package com.appsmith.external.models;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ModuleDTO implements Identifiable {
    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @JsonView(Views.Public.class)
    String name;

    // Variants of publicEntityId { Query module : Id of newAction document, JS module: Id of actionCollection document,
    // UI module: Id of the layout}
    @JsonView(Views.Public.class)
    String publicEntityId;

    @Transient
    @JsonView(Views.Public.class)
    ModuleType type;

    @Transient
    @JsonView(Views.Public.class)
    static final List<String> whitelistedPublicEntitySettingsForModuleInstance =
            List.of("confirmBeforeExecute", "executeOnLoad");

    /*
     "inputs": {
       "token": {
         "name": "token",
         "defaultValue": "10"
       }
     }
    */
    @JsonView(Views.Public.class)
    Map<String, ModuleInput> inputs;

    @JsonView(Views.Public.class)
    Map<String, ModuleActionConfig> settings;

    @Transient
    @JsonView(Views.Public.class)
    List<ActionDTO> entities;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();
}
