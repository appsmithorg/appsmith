package com.appsmith.server.dtos.ce;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MemberInfoCE_DTO {
    String userId;
    String username;
    String name;
    String permissionGroupName;
    String permissionGroupId;
    String photoId;
}
