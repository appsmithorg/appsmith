package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentPermissionCEImpl implements EnvironmentPermissionCE {

    @Override
    public AclPermission getExecutePermission() {
        return null;
    }
}
