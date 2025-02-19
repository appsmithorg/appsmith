package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import java.util.HashSet;
import java.util.Set;

@Entity
@Where(clause = "deleted_at IS NULL")
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

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @Deprecated
    private Set<Permission> permissions = new HashSet<>();

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    private Set<String> assignedToUserIds = new HashSet<>();

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    Set<String> assignedToGroupIds = new HashSet<>();

    public static class Fields extends BaseDomain.Fields {}
}
