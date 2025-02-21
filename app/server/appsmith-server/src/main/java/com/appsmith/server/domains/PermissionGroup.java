package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Document
@FieldNameConstants
@NoArgsConstructor
@Getter
@Setter
public class PermissionGroup extends BaseDomain {

    @NotNull String name;

    @Deprecated
    // TODO: Remove this field once we have migrated the data to use organizationId instead of tenantId
    String tenantId;

    String organizationId;

    String description;

    // TODO: refactor this to defaultDocumentId, as we can use this to store associated document id for
    // which we are auto creating this permission group.
    @Deprecated
    String defaultWorkspaceId;

    String defaultDomainId;
    String defaultDomainType;

    @Deprecated
    Set<Permission> permissions = new HashSet<>();

    Set<String> assignedToUserIds = new HashSet<>();

    Set<String> assignedToGroupIds = new HashSet<>();

    public static class Fields extends BaseDomain.Fields {}
}
