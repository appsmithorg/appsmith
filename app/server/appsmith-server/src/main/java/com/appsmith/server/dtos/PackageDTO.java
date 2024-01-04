package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Identifiable;
import com.appsmith.external.models.Policy;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class PackageDTO implements Identifiable {
    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @Transient
    @JsonView(Views.Export.class)
    private String packageUUID;

    @Transient
    @JsonView(Views.Public.class)
    String originPackageId;

    @Transient
    @JsonView(Views.Export.class)
    String version;

    @JsonView(Views.Public.class)
    String name;

    @Transient
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    String color;

    @JsonView(Views.Public.class)
    Set<CustomJSLibContextDTO> customJSLibs;

    @JsonView(Views.Public.class)
    Set<CustomJSLibContextDTO> hiddenJSLibs;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonView(Views.Internal.class)
    protected Set<Policy> policies = new HashSet<>();

    @Transient
    @JsonView(Views.Public.class)
    String modifiedAt;

    @Transient
    @JsonView(Views.Public.class)
    String modifiedBy;

    @Transient
    @JsonView(Views.Public.class)
    String lastPublishedAt;
}
