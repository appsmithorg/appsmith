package com.appsmith.server.dtos;

import com.appsmith.server.domains.UserGroup;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Transient;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
public class UserGroupDTO {

    String id;

    String name;

    String description;

    String tenantId;

    List<UserCompactDTO> users = new ArrayList<>();

    List<PermissionGroupInfoDTO> roles = new ArrayList<>();

    @Transient
    Set<String> userPermissions = Set.of();

    public void populateTransientFields(UserGroup userGroup) {
        this.setUserPermissions(userGroup.userPermissions);
    }

}
