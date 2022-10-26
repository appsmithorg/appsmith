package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.WorkspaceMemberInfoCE_DTO;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class WorkspaceMemberInfoDTO extends WorkspaceMemberInfoCE_DTO {
    String userGroupId;
    String userGroupName;

    @Builder
    public WorkspaceMemberInfoDTO(String userId, String username, String name, String permissionGroupName, String permissionGroupId, String userGroupId, String userGroupName) {
        super(userId, username, name, permissionGroupName, permissionGroupId);
        this.userGroupId = userGroupId;
        this.userGroupName = userGroupName;
    }
}