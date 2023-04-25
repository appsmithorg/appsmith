package com.appsmith.server.dtos.ce;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class PermissionGroupInfoCE_DTO {
    private String id;

    private String name;

    private String description;

    private String entityId;

    private String entityType;

    private String entityName;

    public PermissionGroupInfoCE_DTO(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public PermissionGroupInfoCE_DTO(String id, String name, String description, String entityId, String entityType, String entityName) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.entityId = entityId;
        this.entityType = entityType;
        this.entityName = entityName;
    }
}