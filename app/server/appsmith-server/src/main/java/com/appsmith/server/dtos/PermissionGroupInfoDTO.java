package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.PermissionGroupInfoCE_DTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
public class PermissionGroupInfoDTO extends PermissionGroupInfoCE_DTO {
    private Set<String> userPermissions;

    private boolean autoCreated;

    public PermissionGroupInfoDTO(String id, String name, String description) {
        super(id, name, description);
    }

    public PermissionGroupInfoDTO(String id, String name, String description, String entityId, String entityType, String entityName) {
        super(id, name, description, entityId, entityType, entityName);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        PermissionGroupInfoDTO that = (PermissionGroupInfoDTO) o;
        return autoCreated == that.autoCreated && Objects.equals(userPermissions, that.userPermissions);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), userPermissions, autoCreated);
    }
}
