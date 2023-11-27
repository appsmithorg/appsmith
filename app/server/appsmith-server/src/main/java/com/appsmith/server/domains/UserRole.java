package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.appsmith.server.acl.AppsmithRole;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Entity
@Deprecated
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @JsonView(Views.Internal.class)
    private String userId;

    @JsonView(Views.Public.class)
    private String username;

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private String roleName;

    @JsonView(Views.Internal.class)
    private AppsmithRole role;
}
