package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import org.springframework.data.mongodb.core.mapping.Document;
import javax.validation.constraints.NotNull;
import java.util.List;

@Document
public class PermissionGroup extends BaseDomain {

    @NotNull
    String name;

    String description;

    List<Permission> permissions;

}
