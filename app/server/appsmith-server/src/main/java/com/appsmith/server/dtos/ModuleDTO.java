package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.helpers.ModuleConsumable;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ModuleDTO implements Identifiable {
    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Export.class)
    private String moduleUUID;

    @Transient
    @JsonView(Views.Public.class)
    private String originModuleId;

    @JsonView(Views.Public.class)
    @NotNull String name;

    @Transient
    @JsonView(Views.Public.class)
    @NotNull ModuleType type;

    @Transient
    @JsonView(Views.Public.class)
    String packageId;

    @Transient
    @JsonView(Views.Export.class)
    String packageUUID;

    @JsonView(Views.Public.class)
    List<ModuleInputForm> inputsForm;

    @JsonView(Views.Public.class)
    List<Layout> layouts;

    // Public entity is created along with the creation of module. Variants of publicEntity { Query module : ActionDTO,
    // JS module: ActionCollectionDTO,
    // UI module: Layout}
    @Transient
    @JsonView(Views.Public.class)
    ModuleConsumable entity;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonView(Views.Public.class)
    Object settingsForm;
}
