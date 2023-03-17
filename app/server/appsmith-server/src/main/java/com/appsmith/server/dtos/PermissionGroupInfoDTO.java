package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.PermissionGroupInfoCE_DTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PermissionGroupInfoDTO extends PermissionGroupInfoCE_DTO {

    public PermissionGroupInfoDTO(String id, String name, String description) {
        super(id, name, description);
    }

    public PermissionGroupInfoDTO(String id, String name, String description, String entityId, String entityType, String entityName) {
        super(id, name, description, entityId, entityType, entityName);
    }
}
