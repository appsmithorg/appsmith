package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.acl.AclPermission;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class Permission {

    @JsonView(Views.Public.class)
    String documentId;

    @JsonView(Views.Public.class)
    AclPermission aclPermission;

}
