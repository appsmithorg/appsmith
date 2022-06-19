package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

@Document
@Getter
@Setter
@NoArgsConstructor
public class UserGroup extends BaseDomain {

    @NotNull
    String name;

    String tenantId;

    String description;

    Set<UserInGroup> users = new HashSet<>();

    String defaultWorkspaceId;

}
