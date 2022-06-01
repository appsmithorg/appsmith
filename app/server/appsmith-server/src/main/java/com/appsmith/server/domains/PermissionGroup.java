package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;

import javax.validation.constraints.NotNull;
import java.util.List;

public class PermissionGroup extends BaseDomain {

    @NotNull
    String name;

    String description;

    List<Permission> permissions;

}
