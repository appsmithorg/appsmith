import homePage from "../../../../../locators/HomePage";
const RBAC = require("../../../../../locators/RBAClocators.json");
import locators from "../../../../../locators/AuditLogsLocators";

describe("Groups&Roles tab Tests", function() {
  let workspaceName;
  let appName;
  let newWorkspaceName;
  let testUser3;
  let testUser4;
  let testUser5;
  const password = "qwerty";
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "CreatePermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const EditPermissionWorkspaceLevel =
    "EditPermission" + `${Math.floor(Math.random() * 1000)}`;
  const CreatePermissionGroupsandRoles =
    "CreateGroupRolePermission" + `${Math.floor(Math.random() * 1000)}`;
  const EditPermissionGroupsandRoles =
    "EditGroupRolePermission" + `${Math.floor(Math.random() * 1000)}`;
  const ViewPermissionGroupsandRoles =
    "ViewGroupRolePermission" + `${Math.floor(Math.random() * 1000)}`;
  const DeletePermissionGroupsandRoles =
    "DeleteGroupRolePermission" + `${Math.floor(Math.random() * 1000)}`;
  const ViewGroupsAssociateRolesPermission =
    "ViewGroupsAssociateRolesPermission" +
    `${Math.floor(Math.random() * 1000)}`;
  const GroupName = "group1" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.generateUUID().then((uid) => {
      testUser3 = `${uid}@appsmith.com`;
      testUser4 = `${uid}2@appsmith.com`;
      testUser5 = `${uid}3@appsmith.com`;
      cy.AddIntercepts();
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.visit("settings/roles");
      cy.NavigateToHome();
      cy.generateUUID().then((uid) => {
        workspaceName = uid;
        appName = uid + "app";
        localStorage.setItem("WorkspaceName", workspaceName);
        cy.createWorkspace();
        cy.wait("@createWorkspace").then((interception) => {
          newWorkspaceName = interception.response.body.data.name;
          cy.renameWorkspace(newWorkspaceName, workspaceName);
        });
        cy.CreateAppForWorkspace(workspaceName, appName);
        cy.visit("settings/general");
        cy.CreatePermissionWorkspaceLevel(
          PermissionWorkspaceLevel,
          workspaceName,
        );
        cy.EditPermissionWorkspaceLevel(
          EditPermissionWorkspaceLevel,
          workspaceName,
        );
        cy.CreatePermissionAppLevel(PermissionAppLevel, workspaceName, appName);

        cy.visit("settings/roles");
        // create user group
        cy.createGroupAndAddUser(
          GroupName,
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTUSERNAME2"),
        );
        cy.get(RBAC.rolesTabinGroup).click();
        cy.get(RBAC.rolesinGroups)
          .contains(PermissionWorkspaceLevel)
          .click();
        cy.get(RBAC.saveButton).click();
        cy.wait("@assignRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.CreatePermissionGroupsRoles(CreatePermissionGroupsandRoles);
        // create role with edit groups and roles permission
        cy.CreateRole();
        cy.get(RBAC.groupsAndRolesTab).click();
        cy.contains("td", "Groups")
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
        cy.contains("td", "Roles")
          .next()
          .next()
          .click();
        cy.RenameRole(EditPermissionGroupsandRoles);
        cy.get(RBAC.saveButton).click();
        // save api call
        cy.wait(2000);
        cy.wait("@saveRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        // verify custom role is added to the list
        cy.get(RBAC.backButton).click();
        cy.wait(2000);
        cy.get(RBAC.searchBar)
          .clear()
          .type(EditPermissionGroupsandRoles);
        cy.wait(2000);
        cy.get(RBAC.roleRow)
          .first()
          .should("have.text", EditPermissionGroupsandRoles);
        // create role with delete groups and roles permission
        cy.CreateRole();
        cy.get(RBAC.groupsAndRolesTab).click();
        cy.contains("td", "Groups")
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
        cy.contains("td", "Roles")
          .next()
          .next()
          .next()
          .next()
          .click();
        cy.RenameRole(ViewPermissionGroupsandRoles);
        cy.get(RBAC.saveButton).click();
        // save api call
        cy.wait(2000);
        cy.wait("@saveRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        // verify custom role is added to the list
        cy.get(RBAC.backButton).click();
        cy.wait(2000);
        cy.get(RBAC.searchBar)
          .clear()
          .type(ViewPermissionGroupsandRoles);
        cy.wait(2000);
        cy.get(RBAC.roleRow)
          .first()
          .should("have.text", ViewPermissionGroupsandRoles);
        cy.CreateRole();
        cy.get(RBAC.groupsAndRolesTab).click();
        cy.contains("td", "Groups")
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
        cy.contains("td", "Roles")
          .next()
          .next()
          .next()
          .click();
        cy.RenameRole(DeletePermissionGroupsandRoles);
        cy.get(RBAC.saveButton).click();
        // save api call
        cy.wait(2000);
        cy.wait("@saveRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        // verify custom role is added to the list
        cy.get(RBAC.backButton).click();
        cy.wait(2000);
        cy.get(RBAC.searchBar)
          .clear()
          .type(DeletePermissionGroupsandRoles);
        cy.wait(2000);
        cy.get(RBAC.roleRow)
          .first()
          .should("have.text", DeletePermissionGroupsandRoles);

        // create role with view groups and associate roles permission
        cy.CreateRole();
        cy.get(RBAC.groupsAndRolesTab).click();
        cy.contains("td", "Groups")
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
        cy.contains("td", "Roles")
          .next()
          .next()
          .next()
          .next()
          .next()
          .next()
          .next()
          .click();
        cy.RenameRole(ViewGroupsAssociateRolesPermission);
        cy.get(RBAC.saveButton).click();
        // save api call
        cy.wait(2000);
        cy.wait("@saveRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        // verify custom role is added to the list
        cy.get(RBAC.backButton).click();
        cy.wait(2000);
        cy.get(RBAC.searchBar)
          .clear()
          .type(ViewGroupsAssociateRolesPermission);
        cy.wait(2000);
        cy.get(RBAC.roleRow)
          .first()
          .should("have.text", ViewGroupsAssociateRolesPermission);

        cy.AssignRoleToUser(
          CreatePermissionGroupsandRoles,
          Cypress.env("TESTUSERNAME1"),
        );
        cy.AssignRoleToUser(
          EditPermissionGroupsandRoles,
          Cypress.env("TESTUSERNAME2"),
        );
        cy.AssignRoleToUser(DeletePermissionGroupsandRoles, testUser3);
        cy.AssignRoleToUser(ViewPermissionGroupsandRoles, testUser4);
        cy.AssignRoleToUser(ViewGroupsAssociateRolesPermission, testUser5);
        cy.LogOut();
      });
    });
  });
  it("1. Verify user has create groups and roles permission", function() {
    //login as user1 the user should have admin access and should see groups tab
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.get(RBAC.usersTab).should("not.exist");
    cy.get(RBAC.rolesTab).click();
    // verify user is able to create new group
    cy.createGroupAndAddUser(
      "testgroup1",
      Cypress.env("TESTUSERNAME2"),
      testUser3,
    );
    // verify user is able to create new role
    cy.CreatePermissionWorkspaceLevel("testPermission", workspaceName);
  });

  it("2. Verify user can invite user to group", function() {
    cy.visit("/settings/groups");
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar).type(GroupName);
    cy.wait(2000);
    cy.get(RBAC.groupsRow)
      .first()
      .should("have.text", GroupName)
      .click();
    cy.wait(4000);
    cy.get(RBAC.addButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(2000);
    cy.get(RBAC.inviteModal).should("be.visible");
    cy.wait(2000);
    cy.xpath(RBAC.EmailInputInviteModal).type(testUser3 + "{enter}");
    cy.wait(2000);
    cy.get(RBAC.inviteButton).click();
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
  });

  it("3. Verify user can remove user from group", function() {
    cy.get(RBAC.usersTabinGroup).click();
    cy.wait(2000);
    // not able to remove user
  });

  it("4.Associate role to user and verify", function() {
    cy.get(RBAC.rolesTabinGroup).click();
    cy.wait(2000);
    cy.get(RBAC.rolesinGroups)
      .contains(EditPermissionWorkspaceLevel)
      .click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.LogOut();
  });

  it("5. Verify user has edit groups and roles permission", function() {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
    cy.get(homePage.profileMenu).should("be.visible");
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.get(RBAC.usersTab).should("not.exist");
    cy.get(RBAC.rolesTab).click();
    // verify user is able to edit the existing role
    cy.get(RBAC.searchBar).type(PermissionWorkspaceLevel);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", PermissionWorkspaceLevel)
      .click();
    cy.wait("@editRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(2000);
    cy.contains("td", `${workspaceName}`)
      .next()
      .click();
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // verify user is able to edit existing group
    cy.get(RBAC.groupsTab).click();
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar).type(GroupName);
    cy.wait(2000);
    cy.get(RBAC.groupsRow)
      .first()
      .should("have.text", GroupName)
      .click();
    cy.wait(3000);
    // rename group
    cy.get(RBAC.contextMenu).click();
    cy.xpath("//span[text()='Rename']").click();
    cy.get(RBAC.editName).type("renamedGroup");
    cy.get(RBAC.usersTabinGroup).click();
    cy.wait("@updateGroup").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.contextMenu).click();
    cy.xpath("//span[text()='Rename']").click();
    cy.get(RBAC.editName).type(GroupName);
    cy.get(RBAC.usersTabinGroup).click();
    cy.wait("@updateGroup").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // add role to group
    cy.get(RBAC.rolesTabinGroup).click();
    cy.get(RBAC.rolesinGroups)
      .contains(PermissionAppLevel)
      .click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.LogOut();
  });

  it("6. Verify user has view groups and roles permissions", function() {
    cy.SignupFromAPI(testUser4, password);
    cy.LogintoAppTestUser(testUser4, password);
    //the user can only view the roles
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.get(RBAC.searchBar).type(PermissionWorkspaceLevel);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", PermissionWorkspaceLevel)
      .click();
    // verify checkboxes are disabled
    cy.contains("td", `${workspaceName}`)
      .next()
      .should("not.be.enabled");
    // verify user can only view the groups
    cy.get(RBAC.groupsTab).click();
    cy.wait(2000);
    cy.get(RBAC.searchBar).type(GroupName);
    cy.wait(2000);
    cy.get(RBAC.groupsRow)
      .first()
      .should("have.text", GroupName)
      .click();
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.LogOut();
  });

  it("7. Verify user has associate role permission but no edit permission for groups", function() {
    cy.SignupFromAPI(testUser5, password);
    cy.LogintoAppTestUser(testUser5, password);
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.get(RBAC.usersTab).should("not.exist");
    cy.get(RBAC.groupsTab).click();
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar).type(GroupName);
    cy.wait(2000);
    cy.get(RBAC.groupsRow)
      .first()
      .should("have.text", GroupName)
      .click();
    cy.wait(3000);

    // context menu group
    cy.get(RBAC.contextMenu).should("not.exist");

    // add users to group
    cy.get(RBAC.usersTabinGroup).click();
    cy.get(RBAC.addButton).should("be.disabled");

    // add role to group
    cy.get(RBAC.rolesTabinGroup).click();
    cy.get(RBAC.rolesinGroups)
      .first()
      .click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.LogOut();
  });

  it("8.Verify user has delete groups and roles permission", function() {
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.get(RBAC.usersTab).should("not.exist");
    cy.get(RBAC.rolesTab).click();
    cy.wait(2000);
    cy.DeleteRole(PermissionAppLevel);
    cy.visit("/settings/groups");
    cy.wait("@fetchGroups").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar).type(GroupName);
    cy.wait(2000);
    cy.get(RBAC.groupsRow)
      .first()
      .should("have.text", GroupName)
      .wait(3000)
      .click();
    cy.wait(3000);
    // delete group
    cy.get(RBAC.contextMenu).click();
    cy.xpath("//span[text()='Delete']").click();
    cy.xpath(RBAC.deleteConfirmation).click();
    cy.wait("@deleteGroup").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(EditPermissionWorkspaceLevel);
    cy.DeleteRole(CreatePermissionGroupsandRoles);
    cy.DeleteRole(EditPermissionGroupsandRoles);
    cy.DeleteRole(ViewPermissionGroupsandRoles);
    cy.DeleteRole(DeletePermissionGroupsandRoles);
    cy.DeleteRole(ViewGroupsAssociateRolesPermission);
    cy.DeleteUser(testUser3);
    cy.DeleteUser(testUser4);
    cy.DeleteUser(testUser5);
  });
});
