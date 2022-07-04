package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.checkerframework.common.aliasing.qual.Unique;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Document
@Getter
@Setter
@NoArgsConstructor
public class RbacPolicy extends BaseDomain {

    @Unique
    String userId;

    String userGroupId;

    Set<String> permissionGroupIds;

}
