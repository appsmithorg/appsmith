package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.PermissionGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoCreatedRoleInfo {
    String id;
    String name;
    String entityId;
    String entityName;
    String entityType;

    public static AutoCreatedRoleInfo constructFromRole(PermissionGroup role) {
        return AutoCreatedRoleInfo.builder()
                .id(role.getId())
                .name(role.getName())
                .entityId(role.getDefaultDomainId())
                .entityType(role.getDefaultDomainType())
                .build();
    }
}
