package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@EqualsAndHashCode
@NoArgsConstructor
public class PermissionGroupInfoDTO {
    
    private String id;

    private String name;
    
    private String description;

    private Set<String> userPermissions;

    public PermissionGroupInfoDTO(String id, String name) {
        this.id = id;
        this.name = name;
    }

}
