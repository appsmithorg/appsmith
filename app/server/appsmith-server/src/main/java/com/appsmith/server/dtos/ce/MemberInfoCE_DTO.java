package com.appsmith.server.dtos.ce;

import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MemberInfoCE_DTO {
    String userId;
    String username;
    String name;
    List<PermissionGroupInfoDTO> roles;
    String photoId;
}
