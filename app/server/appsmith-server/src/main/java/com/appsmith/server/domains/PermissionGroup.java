package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class PermissionGroup extends BaseDomain {

    @NotNull String name;

    @ManyToOne
    Tenant tenant;

    String description;

    // TODO: refactor this to defaultDocumentId, as we can use this to store associated document id for
    // which we are auto creating this permission group.
    @Deprecated
    String defaultWorkspaceId;

    String defaultDomainId;
    String defaultDomainType;

    @OneToMany
    @Deprecated
    private Set<Permission> permissions;

    @OneToMany
    private Set<User> assignedToUsers;

    @OneToMany
    private Set<User> assignedToGroupIds;
}
