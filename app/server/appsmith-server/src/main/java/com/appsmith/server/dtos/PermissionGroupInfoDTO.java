package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode
public class PermissionGroupInfoDTO {
    
    private String id;

    private String name;
    
    private String description;

}
