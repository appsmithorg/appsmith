package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.EnvironmentPermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentPermissionImpl extends EnvironmentPermissionCEImpl implements EnvironmentPermission {
    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_ENVIRONMENTS;
    }
}
