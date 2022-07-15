package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

@Data
@Builder
public class UpdatePermissionGroupDTO {
    
    @NonNull
    private String username;

    private String newPermissionGroup;
    
}
