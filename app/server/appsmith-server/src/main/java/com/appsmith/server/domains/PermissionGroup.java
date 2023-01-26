package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.appsmith.server.dtos.Permission;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

@Document
@NoArgsConstructor
@Getter
@Setter
public class PermissionGroup extends BaseDomain {

    @JsonView(Views.Public.class)
    @NotNull String name;

    @JsonView(Views.Public.class)
    String tenantId;

    @JsonView(Views.Public.class)
    String description;

    //TODO: refactor this to defaultDocumentId, as we can use this to store associated document id for 
    //which we are auto creating this permission group.
    @JsonView(Views.Public.class)
    String defaultWorkspaceId;

    @JsonView(Views.Public.class)
    Set<Permission> permissions = new HashSet<>();

    @JsonView(Views.Public.class)
    Set<String> assignedToUserIds = new HashSet<>();

    @JsonView(Views.Public.class)
    Set<String> assignedToGroupIds = new HashSet<>();
}
