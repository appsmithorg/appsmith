package com.appsmith.server.domains;

import java.util.Set;

import javax.validation.constraints.NotNull;

import org.springframework.data.mongodb.core.mapping.Document;

import com.appsmith.external.models.BaseDomain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document
@Getter
@Setter
@NoArgsConstructor
public class UserGroup extends BaseDomain {

    @NotNull
    String name;

    String tenantId;

    String description;

    Set<UserInGroup> users;

    String defaultWorkspaceId;

}
