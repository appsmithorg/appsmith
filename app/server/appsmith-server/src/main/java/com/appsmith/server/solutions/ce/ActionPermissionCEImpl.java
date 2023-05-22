/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class ActionPermissionCEImpl implements ActionPermissionCE, DomainPermissionCE {

  @Override
  public AclPermission getEditPermission() {
    return AclPermission.MANAGE_ACTIONS;
  }

  @Override
  public AclPermission getReadPermission() {
    return AclPermission.READ_ACTIONS;
  }

  @Override
  public AclPermission getExecutePermission() {
    return AclPermission.EXECUTE_ACTIONS;
  }

  @Override
  public AclPermission getDeletePermission() {
    return AclPermission.MANAGE_ACTIONS;
  }
}
