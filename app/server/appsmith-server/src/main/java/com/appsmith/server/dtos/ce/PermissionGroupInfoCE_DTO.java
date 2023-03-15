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

    public PermissionGroupInfoCE_DTO(String id, String name) {
        this.id = id;
        this.name = name;
    }
}