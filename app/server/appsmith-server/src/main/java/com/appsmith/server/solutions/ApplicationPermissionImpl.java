package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.ApplicationPermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class ApplicationPermissionImpl extends ApplicationPermissionCEImpl implements ApplicationPermission {

    @Override
    public AclPermission getPageCreatePermission() {
        return AclPermission.APPLICATION_CREATE_PAGES;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_APPLICATIONS;
    }
}
