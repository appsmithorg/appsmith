package com.appsmith.server.domains;

import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import lombok.Data;

import java.util.List;

@Data
public class GacEntityMetadata {
    String id;
    String type;
    String name;
    List<PermissionViewableName> permissions;
}
