package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

@Data
@Builder
public class UpdateUserGroupDTO {
    
    @NonNull
    private String username;

    private String newGroupId;
    
}
