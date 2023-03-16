package com.appsmith.server.dtos.ce;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MemberInfoCE_DTO {
    String userId;
    String username;
    String name;
    List<AutoCreatedRoleInfo> roles;
    String photoId;
}
