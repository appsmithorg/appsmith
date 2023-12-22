package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.Property;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ModuleInstanceDTO implements Identifiable {
    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Public.class)
    ModuleType type;

    @Transient
    @JsonView(Views.Export.class)
    String moduleUUID;

    @Transient
    @JsonView(Views.Public.class)
    String sourceModuleId;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    CreatorContextType contextType;

    @Transient
    @JsonView(Views.Public.class)
    String contextId;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Internal.class)
    String pageId; // if module is instantiated in the context of PAGE then this moduleId will have the id of that page

    @JsonView(Views.Internal.class)
    String moduleId;

    // We will look for dynamic bindings only in the `value` field of the `inputs` map
    @JsonView(Views.Public.class)
    Map<String, String> inputs;

    @Transient
    @JsonView({Views.Export.class})
    PublicEntityDTO publicEntity;

    @JsonView(Views.Public.class)
    List<Property> dynamicBindingPathList;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Set<String> jsonPathKeys;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt = null;

    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    public void sanitiseForExport() {
        this.setDefaultResources(null);
        if (this.getUserPermissions() != null) {
            this.getUserPermissions().clear();
        }
    }
}
