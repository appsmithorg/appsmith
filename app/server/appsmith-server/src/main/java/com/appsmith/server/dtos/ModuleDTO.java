package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.helpers.ModuleConsumable;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
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

    @Transient
    @JsonView(Views.Public.class)
    ModuleType type;

    @Transient
    @JsonView(Views.Public.class)
    String packageId;

    /*
     "inputs": {
       "token": {
         "name": "token",
         "defaultValue": "10"
       }
     }
    */
    // key is the name of the input
    @JsonView(Views.Public.class)
    Map<String, ModuleInput> inputs;

    // Variants of publicEntity { Query module : ActionDTO, JS module: ActionCollectionDTO,
    // UI module: Layout}
    @Transient
    @JsonView(Views.Public.class)
    ModuleConsumable publicEntity;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();
}
