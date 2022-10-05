package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Set;

@Data
public class RoleViewDTO {
    String id;
    String name;
    LinkedHashMap<String, RoleTabDTO> tabs;
    public Set<String> userPermissions = new HashSet<>();
}
