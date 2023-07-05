package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupCompactDTO {

    String id;

    String name;

    Set<String> userPermissions;

    public UserGroupCompactDTO(String id, String name) {
        this.id = id;
        this.name = name;
        this.userPermissions = new HashSet<>();
    }
}
