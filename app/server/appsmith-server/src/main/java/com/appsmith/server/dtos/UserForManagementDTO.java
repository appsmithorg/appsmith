package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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

    @JsonProperty(value = "isProvisioned")
    boolean isProvisioned;

    Set<String> userPermissions;

    public UserForManagementDTO(
            String id,
            String username,
            List<UserGroupCompactDTO> groups,
            List<PermissionGroupInfoDTO> roles,
            boolean isProvisioned,
            Set<String> userPermissions) {
        this.id = id;
        this.username = username;
        this.groups = groups;
        this.roles = roles;
        this.isProvisioned = isProvisioned;
        this.userPermissions = userPermissions;
    }
}
