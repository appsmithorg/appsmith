package com.appsmith.server.domains;

import com.appsmith.server.acl.AppsmithRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class UserRole {
    @JsonIgnore
    String userId;

    String username;

    String name;

    String roleName;

    @JsonIgnore
    AppsmithRole role;
}
