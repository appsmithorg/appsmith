package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;

@Document
public class UserGroup extends BaseDomain {

    @NotNull
    String name;

    String tenantId;

    String description;

    List<UserInGroup> users;

    Boolean isDefault;

}
