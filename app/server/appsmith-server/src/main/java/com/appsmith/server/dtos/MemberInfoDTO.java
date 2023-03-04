package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.MemberInfoCE_DTO;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class MemberInfoDTO extends MemberInfoCE_DTO {

    @Builder
    public MemberInfoDTO(String userId, String username, String name, String permissionGroupName, String permissionGroupId, String photoId) {
        super(userId, username, name, permissionGroupName, permissionGroupId, photoId);
    }
}