package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.PagePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class PagePermissionImpl extends PagePermissionCEImpl implements PagePermission {
    @Override
    public AclPermission getActionCreatePermission() {
        return AclPermission.PAGE_CREATE_PAGE_ACTIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_PAGES;
    }
}
