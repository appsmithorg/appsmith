package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.Permission;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;

@Document
@NoArgsConstructor
@Getter
@Setter
public class PermissionGroup extends BaseDomain {

    @NotNull String name;

    String tenantId;

    String description;

    List<Permission> permissions;

    Boolean isDefault;

}
