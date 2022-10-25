package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Set;

@Data
@EqualsAndHashCode
public class PermissionGroupInfoDTO {
    
    private String id;

    private String name;
    
    private String description;

    private Set<String> userPermissions;

}
