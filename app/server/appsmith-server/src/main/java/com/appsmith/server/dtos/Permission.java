package com.appsmith.server.dtos;

import com.appsmith.server.acl.AclPermission;
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

    String documentId;

    AclPermission aclPermission;
}
