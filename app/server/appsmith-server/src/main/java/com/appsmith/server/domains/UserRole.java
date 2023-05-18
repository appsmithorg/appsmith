package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
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

    @JsonView(Views.Public.class)
    String username;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String roleName;

    @JsonView(Views.Internal.class)
    AppsmithRole role;
}
