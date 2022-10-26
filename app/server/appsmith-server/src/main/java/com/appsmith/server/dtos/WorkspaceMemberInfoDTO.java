package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.WorkspaceMemberInfoCE_DTO;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class WorkspaceMemberInfoDTO extends WorkspaceMemberInfoCE_DTO {

    @Builder
    public WorkspaceMemberInfoDTO(String userId, String username, String name, String permissionGroupName, String permissionGroupId) {
        super(userId, username, name, permissionGroupName, permissionGroupId);
    }
}