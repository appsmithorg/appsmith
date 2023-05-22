/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.acl;

import static org.assertj.core.api.Assertions.assertThat;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Theme;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
class AclPermissionTest {

  @Test
  void testIsPermissionForEntity() {
    assertThat(
            AclPermission.isPermissionForEntity(AclPermission.READ_APPLICATIONS, Application.class))
        .isTrue();
    assertThat(AclPermission.isPermissionForEntity(AclPermission.READ_APPLICATIONS, Theme.class))
        .isFalse();

    // Assert that Action related Permission should return True, when checked against Action,
    // NewAction and Action Collection.
    assertThat(AclPermission.isPermissionForEntity(AclPermission.MANAGE_ACTIONS, Action.class))
        .isTrue();
    assertThat(AclPermission.isPermissionForEntity(AclPermission.MANAGE_ACTIONS, NewAction.class))
        .isTrue();
    assertThat(
            AclPermission.isPermissionForEntity(
                AclPermission.MANAGE_ACTIONS, ActionCollection.class))
        .isTrue();

    // Assert that Page related Permission should return True, when checked against Page and
    // NewPage.
    assertThat(AclPermission.isPermissionForEntity(AclPermission.MANAGE_PAGES, Page.class))
        .isTrue();
    assertThat(AclPermission.isPermissionForEntity(AclPermission.MANAGE_PAGES, NewPage.class))
        .isTrue();
  }
}
