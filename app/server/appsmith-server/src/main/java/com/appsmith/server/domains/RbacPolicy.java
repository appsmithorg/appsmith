package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document
public class RbacPolicy extends BaseDomain {

    String userId;

    String userGroupId;

    List<String> permissionGroupIds;

}
