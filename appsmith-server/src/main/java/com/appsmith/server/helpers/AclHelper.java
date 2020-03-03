package com.appsmith.server.helpers;

import com.appsmith.server.domains.Arn;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;
import lombok.extern.slf4j.Slf4j;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class AclHelper {

    private static final String ARN_PREFIX = "arn:appsmith:";
    private static final Pattern pattern = Pattern.compile("arn:appsmith:(\\w*):([\\w]*):([\\w\\*]*)");

    public static final String createArn(AclEntity aclEntity, User principal, String id) {
        StringBuilder arnBuilder = new StringBuilder(ARN_PREFIX)
                .append(principal.getCurrentOrganizationId())
                .append(":").append(aclEntity.value());
        arnBuilder = (id != null) ? arnBuilder.append(":").append(id) : arnBuilder.append(":*");

        return arnBuilder.toString();
    }

    public static final String concatenatePermissionWithEntityName(String permission, String entityName) {
        return permission + "::" + entityName;
    }

    public static final Arn getArnFromString(String arnString) {
        Matcher matcher = pattern.matcher(arnString);

        if (matcher.find()) {
            Arn arn = new Arn();
            arn.setBase(ARN_PREFIX);
            arn.setOrganizationId(matcher.group(1));
            arn.setEntityName(matcher.group(2));
            arn.setEntityId(matcher.group(3));
            return arn;
        }

        return null;
    }
}
