import RBAC from "../locators/RBAClocators.json";
import homePage from "../locators/HomePage";

Cypress.Commands.add(
  "CreatePermissionWorkspaceLevel",
  (Role, WorkspaceName) => {
    cy.get(RBAC.rolesTab).click();
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait(2000);
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add(
  "CreatePermissionAppLevel",
  (Role, WorkspaceName, AppName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add(
  "CreatePermissionPageLevel",
  (Role, WorkspaceName, AppName, PageName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.xpath(`//span[text()="${AppName}"]`)
      .last()
      .click();
    cy.contains("td", `${PageName}`)
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add(
  "ExportPermissionWorkspaceLevel",
  (Role, WorkspaceName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .next()
      .next()
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);

Cypress.Commands.add(
  "DeletePermissionAppLevel",
  (Role, WorkspaceName, AppName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add(
  "DeletePermissionPageLevel",
  (Role, WorkspaceName, AppName, PageName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.xpath(`//span[text()="${AppName}"]`)
      .last()
      .click();
    cy.contains("td", `${PageName}`)
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add("RenameRole", (Role) => {
  cy.get(RBAC.contextMenu).click();
  cy.xpath(RBAC.rename).click();
  cy.get(RBAC.editName).type(Role);
  cy.get("body").click();
  cy.wait(2000);
  cy.wait("@renameRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("RenameGroup", (Role) => {
  cy.get(RBAC.contextMenu).click();
  cy.xpath(RBAC.rename).click();
  cy.get(RBAC.editName).type(Role);
  cy.get("body").click();
  cy.wait(2000);
  cy.wait("@renameGroup").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("AssignRoleToUser", (Role, userEmail) => {
  cy.get(RBAC.usersTab).click();
  cy.wait("@fetchUsers").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.addButton).click();
  cy.get(RBAC.inviteModal).should("be.visible");
  cy.get(RBAC.rolesTabInviteModal).click();
  cy.xpath(RBAC.EmailInputInviteModal).type(userEmail);
  // select role
  cy.xpath(RBAC.selectFromDropdownInviteModal).click();
  cy.get(`[data-cy="t--dropdown-option-${Role}"]`)
    .first()
    .click();
  cy.get(".bp3-heading").click();
  cy.get(RBAC.inviteButton).click();
  cy.wait("@associateRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(2000);
});

Cypress.Commands.add("AssignGroupToUser", (Group, userEmail) => {
  cy.get(RBAC.usersTab).click();
  cy.wait("@fetchUsers").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.addButton).click();
  cy.get(RBAC.inviteModal).should("be.visible");
  cy.get(RBAC.groupsTabInviteModal).click();
  cy.xpath(RBAC.EmailInputInviteModal).type(userEmail);
  // select role
  cy.xpath(RBAC.selectFromDropdownInviteModal).click();
  cy.get(`[data-cy="t--dropdown-option-${Group}"]`)
    .first()
    .click();
  cy.get(".bp3-heading").click();
  cy.get(RBAC.inviteButton).click();
  cy.wait("@mockPostInvite").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(2000);
});

Cypress.Commands.add("EditPermissionWorkspaceLevel", (Role, WorkspaceName) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get("[data-testid='t--roles-cell']")
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add(
  "EditPermissionAppLevel",
  (Role, WorkspaceName, AppName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);

Cypress.Commands.add(
  "EditPermissionPageLevel",
  (Role, WorkspaceName, AppName, PageName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.xpath(`//span[text()="${AppName}"]`)
      .last()
      .click();
    cy.contains("td", `${PageName}`)
      .next()
      .next()
      .click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);

Cypress.Commands.add(
  "DeletePermissionWorkspaceLevel",
  (Role, WorkspaceName) => {
    cy.get(RBAC.rolesTab).click();
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait(2000);
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .next()
      .click();
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);

Cypress.Commands.add("ViewPermissionWorkspaceLevel", (Role, WorkspaceName) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .next()
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add(
  "ViewPermissionAppLevel",
  (Role, WorkspaceName, AppName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);

    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);

Cypress.Commands.add(
  "ViewPermissionPageLevel",
  (Role, WorkspaceName, AppName, PageName) => {
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.addButton).click();
    cy.wait("@createRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .next()
      .next()
      .next()
      .click();
    cy.xpath(`//span[text()="${AppName}"]`)
      .last()
      .click();
    cy.contains("td", `${PageName}`)
      .next()
      .next()
      .next()
      .next()
      .click();
    cy.RenameRole(Role);
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.backButton).click();
    cy.wait(1000);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", Role);
  },
);
Cypress.Commands.add(
  "createGroupAndAddUser",
  (PermissionGroupName, userEmail1, userEmail2) => {
    cy.get(RBAC.groupsTab).click();
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.addButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(2000);
    cy.get(RBAC.addUsers).click();
    cy.get(RBAC.inviteModal).should("be.visible");
    cy.wait(2000);
    cy.xpath(RBAC.EmailInputInviteModal).type(
      userEmail1 + "{enter}" + userEmail2 + "{enter}",
    );
    cy.wait(2000);
    cy.get(RBAC.inviteButton).click();
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    cy.get(RBAC.contextMenu).click();
    cy.xpath("//span[text()='Rename']").click();
    cy.get(RBAC.editName).type(PermissionGroupName);
    cy.xpath("//span[text()='Users']").click();
  },
);

Cypress.Commands.add("CreatePermissionGroupsRoles", (Role) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  cy.get(RBAC.groupsAndRolesTab).click();
  cy.contains("td", "Groups")
    .next()
    .click();
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.contains("td", "Roles")
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add("ViewAuditLogsRole", (Role) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  cy.get(RBAC.othersTab).click();

  cy.contains("td", "Audit Logs")
    .next()
    .next()
    .next()
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add("CreateWorkspaceRole", (Role) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.get(RBAC.othersTab).click();
  cy.wait(2000);
  cy.contains("td", "Workspaces")
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add("EditWorkspaceRole", (Role, WorkspaceName) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .next()
    .next()
    .click();
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(2000);
  cy.get(RBAC.othersTab).click();
  cy.wait(2000);
  cy.contains("td", "Workspaces").click();
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add("DeleteWorkspaceRole", (Role, WorkspaceName) => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .next()
    .next()
    .click();
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(2000);
  cy.get(RBAC.othersTab).click();
  cy.wait(2000);
  cy.contains("td", "Workspaces").click();
  cy.contains("td", `${WorkspaceName}`)
    .next()
    .next()
    .next()
    .click();
  cy.RenameRole(Role);
  cy.get(RBAC.saveButton).click();
  // save api call
  cy.wait(2000);
  cy.wait("@saveRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(RBAC.backButton).click();
  cy.wait(1000);
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .should("have.text", Role);
});

Cypress.Commands.add("CreateRole", (name = "") => {
  cy.get(RBAC.rolesTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  if (name) {
    cy.RenameRole(name);
  }
});

Cypress.Commands.add("CreateGroup", (name = "") => {
  cy.get(RBAC.groupsTab).click();
  cy.get(RBAC.addButton).click();
  cy.wait("@createGroup").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.wait(2000);
  if (name) {
    cy.RenameGroup(name);
  }
});

Cypress.Commands.add("DeleteRole", (Role) => {
  cy.get(RBAC.searchBar)
    .clear()
    .type(Role);
  cy.wait(2000);
  cy.get(RBAC.roleRow)
    .first()
    .click();
  cy.wait(2000);
  cy.get(RBAC.contextMenu).click();
  cy.xpath("//span[text()='Delete']").click();
  cy.xpath(RBAC.deleteConfirmation).click();
  cy.wait("@deleteRole").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(2000);
});

Cypress.Commands.add("AddIntercepts", () => {
  cy.intercept("PUT", "/api/v1/roles/*").as("updateRoles");
  cy.intercept("GET", "/api/v1/roles").as("fetchRoles");
  cy.intercept("DELETE", "/api/v1/roles/*").as("deleteRole");
  cy.intercept("GET", "/api/v1/roles/assign").as("assignRole");
  cy.intercept("PUT", "/api/v1/roles/configure/*").as("saveRole");
  cy.intercept("PUT", "/api/v1/roles/*").as("renameRole");
  cy.intercept("GET", "/api/v1/roles/configure/*").as("editRole");
  cy.intercept("POST", "/api/v1/roles").as("createRole");
  cy.intercept("GET", "/api/v1/user-groups").as("fetchGroups");
  cy.intercept("POST", "/api/v1/user-groups").as("createGroup");
  cy.intercept("PUT", "/api/v1/user-groups/*").as("renameGroup");
  cy.intercept("DELETE", "/api/v1/user-groups/*").as("deleteGroup");
  cy.intercept("POST", "api/v1/user-groups/invite").as("inviteUser");
  cy.intercept("PUT", "/api/v1/user-groups/*").as("updateGroup");
  cy.intercept("GET", "/api/v1/users/manage/all").as("fetchUsers");
  cy.intercept("PUT", "/api/v1/roles/associate").as("associateRoles");
  cy.intercept("GET", "/api/v1/audit-logs/*").as("fetchAuditLogs");
  cy.intercept("POST", "/api/v1/user-groups/invite", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("mockPostInvite");
});
