package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.appsmith.server.acl.AppsmithRole;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Deprecated
public class UserRole {
    @JsonView(Views.Internal.class)
    String userId;

    @JsonView(Views.Api.class)
    String username;

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String roleName;

    @JsonView(Views.Internal.class)
    AppsmithRole role;
}
