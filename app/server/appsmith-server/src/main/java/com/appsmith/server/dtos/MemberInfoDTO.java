package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.MemberInfoCE_DTO;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class MemberInfoDTO extends MemberInfoCE_DTO {

    @Builder
    public MemberInfoDTO(String userId, String username, String name, List<PermissionGroupInfoDTO> roles, String photoId) {
        super(userId, username, name, roles, photoId);
    }
}