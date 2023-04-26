package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserForManagementDTO {

    String id;

    String username;

    String name;

    List<UserGroupCompactDTO> groups = new ArrayList<>();

    List<PermissionGroupInfoDTO> roles = new ArrayList<>();

    String photoId;

    public UserForManagementDTO(String id, String username, List<UserGroupCompactDTO> groups, List<PermissionGroupInfoDTO> roles) {
        this.id = id;
        this.username = username;
        this.groups = groups;
        this.roles = roles;
    }

}
