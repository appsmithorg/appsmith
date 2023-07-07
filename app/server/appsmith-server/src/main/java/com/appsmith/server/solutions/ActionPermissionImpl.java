package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.ActionPermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class ActionPermissionImpl extends ActionPermissionCEImpl implements ActionPermission {

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_ACTIONS;
    }
}
