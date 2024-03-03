package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;

import java.util.HashSet;
import java.util.Set;

@Entity
@FieldNameConstants
@NoArgsConstructor
@Getter
@Setter
public class PermissionGroup extends BaseDomain {

    @NotNull String name;

    String tenantId;

    String description;

    // TODO: refactor this to defaultDocumentId, as we can use this to store associated document id for
    // which we are auto creating this permission group.
    @Deprecated
    String defaultWorkspaceId;

    String defaultDomainId;
    String defaultDomainType;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Deprecated
    private Set<Permission> permissions = new HashSet<>();

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Set<String> assignedToUserIds = new HashSet<>();

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    Set<String> assignedToGroupIds = new HashSet<>();

    public static class Fields extends BaseDomain.Fields {}
}
