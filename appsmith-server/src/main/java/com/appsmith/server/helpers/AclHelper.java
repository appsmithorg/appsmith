package com.appsmith.server.helpers;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;

public class AclHelper {

    private static final String ARN_PREFIX = "arn:appsmith:";

    public static final String createArn(AclEntity aclEntity, User principal, String id) {
        StringBuilder arnBuilder = new StringBuilder(ARN_PREFIX)
                .append(principal.getCurrentOrganizationId())
                .append(":").append(aclEntity.value());
        arnBuilder = (id != null) ? arnBuilder.append(":").append(id) : arnBuilder.append(":*");

        return arnBuilder.toString();
    }

    public static final String concatenatePermissionWithArn(String permission, String arn) {
        return permission + "::" + arn;
    }

    public static final String extractArnFromString(String arn) {
        return null;
    }
}
