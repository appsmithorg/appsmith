import RBAC from "../locators/RBAClocators.json";
import { ObjectsRegistry } from "./Objects/Registry";

type ActionType =
  | "Create"
  | "Edit"
  | "Delete"
  | "View"
  | "Invite User"
  | "Remove User"
  | "Export";

export class RBACHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private assertHelper = ObjectsRegistry.AssertHelper;
  private adminSettings = ObjectsRegistry.AdminSettings;

  /**
   * Gets the role name in the page
   * @param Rolename
   * @returns
   */
  public textToClick = (Rolename: string) => "//*[text()='" + Rolename + "']";

  /**
   * Gets the checkbox fof given entity and action
   * @param entityName - Page name, Appname, Workspace name
   * @param Action - Create, Edit, Delete, View
   * @returns
   */
  public checkbox = (entityName: string, Action: ActionType) =>
    "//*[contains(text(), '" +
    entityName +
    "')]/ancestor::tr//*[contains(@data-testid, '" +
    Action +
    "')]";
  public usersTabInGroupPage = "//button//*[text()='Users']";
  public rolesTabInGroupPage = "//button//*[text()='Roles']";
  public userEmailInUsersPage = ".user-email-link";
  public rolesTab = "[data-testid='t--tab-roles']";
  public defaultRoleToggle = "[data-testid='t--toggle-wrapper']";
  public deleteMenu = "[data-testid='t--delete-menu-item']";
  public rolesRow = (role: string) => "//*[contains(text(),'" + role + "')]";
  public auditLogText = (entity: string, action: string) =>
    "//*[contains(text(),'" +
    entity +
    "')]//span[contains(text(),'" +
    action +
    "')]";
  public userRow = (userEmail: string) =>
    `//*[@data-testid="user-listing-userCell"]//*[text()="${userEmail}"]`;
  public arrow = (rowName: string) =>
    `//*[@data-testid="right-arrow-2"]/ancestor::tr//*[text()="${rowName}"]`;
  public contextMenuInUsers = (userName: string) =>
    `//*[text()="${userName}"]/ancestor::tr//*[@data-testid="actions-cell-menu-icon"]`;
  public roleEditIcon = (roleName: string) =>
    `//span[text()="${roleName}"]/parent::div/span[2]//span[@data-testid="t--edit-icon"]`;
  // groups and remove user are input
  public checkBoxInGroupsAndRolesTab = (groupName: string, action: string) =>
    "//*[contains(text(),'" +
    groupName +
    "')]/ancestor::tr//*[contains(@data-testid,'" +
    action +
    "')]";
  // declare the locator role label
  public roleLabel = (role: string) => `[label="${role}"]`;

  /**
   *
   * @param Role Assings given role to the given user email
   * @param UserEmail
   */
  public AssignRoleToUser = (Role: string, UserEmail: string) => {
    this.agHelper.GetNClick(RBAC.usersTab);
    this.assertHelper.AssertNetworkStatus("@fetchUsers", 200);
    this.agHelper.GetNClick(RBAC.addButton);
    this.agHelper.GetNClick(RBAC.rolesTabInviteModal);
    this.agHelper.TypeText(RBAC.EmailInputInviteModal, UserEmail);
    this.agHelper.GetNClick(RBAC.selectFromDropdownInviteModal);
    this.agHelper.GetNClick(this.roleLabel(Role));
    this.agHelper.GetNClick(RBAC.inviteButton);
    this.assertHelper.AssertNetworkStatus("@associateRoles", 200);
  };

  /**
   * Function to create role with page level permissions - Create, Edit, View
   * @param Role
   * @param Workspace
   * @param App
   * @param Page
   */
  public CreatePermissionPageLevel = (
    Role: string,
    Workspace: string,
    App: string,
    Page: string,
  ) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.agHelper.GetNClick(RBAC.addButton);
    this.assertHelper.AssertNetworkStatus("@createRole", 201);
    this.agHelper.ContainsNClick(Workspace);
    this.agHelper
      .GetElement(this.checkbox(App, "Edit") + "//input")
      .check({ force: true });
    this.agHelper.ContainsNClick(App);
    this.agHelper
      .GetElement(this.checkbox(Page, "Create") + "//input")
      .check({ force: true });
    this.RenameRole(Role);
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@saveRole", 200);
    this.agHelper.GetNClick(RBAC.backButton);
  };

  /**
   * Function to create role with app level permissions - Create, Edit, View
   * @param Role
   * @param Workspace
   * @param App
   * @param Page
   */
  public CreatePermissionAppLevel = (
    Role: string,
    Workspace: string,
    App: string,
  ) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.agHelper.GetNClick(RBAC.addButton);
    this.assertHelper.AssertNetworkStatus("@createRole", 201);
    this.agHelper.ContainsNClick(Workspace);
    this.agHelper
      .GetElement(this.checkbox(App, "Edit") + "//input")
      .check({ force: true });
    this.agHelper.ContainsNClick(App);
    this.agHelper
      .GetElement(this.checkbox(App, "Create") + "//input")
      .check({ force: true });
    this.RenameRole(Role);
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@saveRole", 200);
    this.agHelper.GetNClick(RBAC.backButton);
  };

  /**
   * Add audit log view permission to the given role
   */
  public AddAuditLogViewPermission = (Role: string) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.agHelper.TypeText(RBAC.searchBar, Role);
    this.agHelper.WaitUntilEleAppear(this.textToClick(Role));
    this.agHelper.GetNClick(this.textToClick(Role), 0, true);
    this.agHelper.GetNClick(RBAC.othersTab);
    this.agHelper
      .GetElement(this.checkbox("Audit Logs", "View") + "//input")
      .check({ force: true });
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@saveRole", 200);
  };

  /**
   * Renames the role in role page
   * @param Role
   */
  public RenameRole = (Role: string) => {
    this.agHelper.GetNClick(RBAC.contextMenu);
    this.agHelper.GetNClick(RBAC.rename);
    this.agHelper.GetElement(RBAC.editName).type(Role);
    this.agHelper.PressEnter();
    this.assertHelper.AssertNetworkStatus("@renameRole", 200);
  };

  /**
   * Enables or disables the permissions for the role
   * @param Role
   * @param entityName - Page name, Appname, Workspace name
   * @param Action
   * @param Select
   */
  public ModifyPermissionsNSave = (
    Role: string,
    entityName: string,
    Action: ActionType,
    Select: boolean,
  ) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.assertHelper.AssertNetworkStatus("@fetchRoles", 200);
    this.agHelper.ClearTextField(RBAC.searchBar);
    this.agHelper.TypeText(RBAC.searchBar, Role);
    this.agHelper.WaitUntilEleAppear(this.textToClick(Role));
    this.agHelper.GetNClick(this.textToClick(Role), 0, true);
    this.agHelper.ClearTextField(RBAC.searchBar);
    this.agHelper.TypeText(RBAC.searchBar, entityName);
    this.agHelper.AssertAttribute(
      this.checkbox(entityName, Action) +
        "//*[contains(@class,'design-system-checkbox')]",
      "data-checked",
      (!Select).toString(),
    );
    this.agHelper.WaitUntilEleAppear(this.checkbox(entityName, Action));
    if (Select)
      this.agHelper
        .GetElement(this.checkbox(entityName, Action) + "//input")
        .check({ force: true });
    else
      this.agHelper
        .GetElement(this.checkbox(entityName, Action) + "//input")
        .uncheck({ force: true });
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@saveRole", 200);
  };

  /**
   * Adds given default role to the user from User page
   */
  public AddDefaultRole = (
    userEmail: string,
    defaultRole: string,
    workspaceName: string | null = null,
  ) => {
    this.adminSettings.NavigateToAdminSettings();
    this.agHelper.GetNClick(RBAC.usersTab);
    this.assertHelper.AssertNetworkStatus("@fetchUsers", 200);
    this.agHelper.TypeText(RBAC.searchBar, userEmail);
    this.agHelper.PressEnter();
    this.agHelper.GetNClick(this.userRow(userEmail), 0, true, 500);
    this.agHelper.WaitUntilEleAppear(this.rolesTab);
    this.agHelper.GetNClick(this.rolesTab);
    this.agHelper.GetNClick(this.defaultRoleToggle);
    // if workspace name is not null then set role variable else set default role
    const role = workspaceName
      ? defaultRole + " - " + workspaceName
      : defaultRole;
    this.agHelper.GetNClick(this.rolesRow(role));
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@associateRoles", 200);
  };

  /**
   * Create a role with given name
   */
  public CreateRole = (Role: string) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.agHelper.GetNClick(RBAC.addButton);
    this.assertHelper.AssertNetworkStatus("@createRole", 201);
    this.agHelper.GetNClick(RBAC.editName).type(Role);
    this.agHelper.PressEnter();
    this.assertHelper.AssertNetworkStatus("@renameRole", 200);
  };

  /**
   * Removes the given role from the user
   */
  public RemoveRole = (userEmail: string, role: string) => {
    this.adminSettings.NavigateToAdminSettings();
    this.agHelper.GetNClick(RBAC.usersTab);
    this.assertHelper.AssertNetworkStatus("@fetchUsers", 200);
    this.agHelper.TypeText(RBAC.searchBar, userEmail);
    this.agHelper.PressEnter();
    this.agHelper.GetNClick(this.userRow(userEmail), 0, true, 500);
    this.agHelper.WaitUntilEleAppear(this.rolesTab);
    this.agHelper.GetNClick(this.rolesTab);
    this.agHelper.GetNClick(this.rolesRow(role));
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@associateRoles", 403);
  };

  /**
   * function to delete given role in roles page
   */
  public DeleteRole = (Role: string) => {
    this.agHelper.GetNClick(RBAC.searchBar);
    this.agHelper.ClearTextField(RBAC.searchBar);
    this.agHelper.TypeText(RBAC.searchBar, Role);
    this.agHelper.WaitUntilEleAppear(this.textToClick(Role));
    this.agHelper.GetNClick(this.textToClick(Role), 0, true);
    this.agHelper.GetNClick(RBAC.contextMenu);
    this.agHelper.GetNClick(RBAC.delete);
    this.agHelper.GetNClick(RBAC.deleteConfirmation);
    this.assertHelper.AssertNetworkStatus("@deleteRole", 200);
  };

  /**
   * Perform actions in the Groups & Roles Tab in roles page
   */
  public GroupsAndRolesTabInUsersPage = (group: string, action: ActionType) => {
    this.agHelper.GetNClick(RBAC.groupsAndRolesTab);
    this.agHelper.GetNClick(this.arrow("Groups"));
    this.agHelper.GetNClick(this.checkBoxInGroupsAndRolesTab(group, action));
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@saveRole", 200);
  };

  /**
   * goto given roles
   */

  public GotoRoles = (role: string) => {
    this.agHelper.GetNClick(RBAC.rolesTab);
    this.assertHelper.AssertNetworkStatus("@fetchRoles", 200);
    this.agHelper.TypeText(RBAC.searchBar, role);
    this.agHelper.GetNClick(this.textToClick(role), 0, true);
    this.assertHelper.AssertNetworkStatus("assignRole", 200);
  };

  /**
   * goto given groups
   */
  public GotoGroups = (group: string) => {
    this.agHelper.GetNClick(RBAC.groupsTab);
    this.assertHelper.AssertNetworkStatus("@fetchGroups", 200);
    this.agHelper.TypeText(RBAC.searchBar, group);
    this.agHelper.GetNClick(this.textToClick(group), 0, true);
  };

  /**
   * click groupsTab in admin settings, click addButton, rename group,
   */
  public CreateGroup = (groupname: string) => {
    this.agHelper.GetNClick(RBAC.groupsTab);
    this.assertHelper.AssertNetworkStatus("@fetchGroups", 200);
    this.agHelper.GetNClick(RBAC.addButton);
    this.assertHelper.AssertNetworkStatus("@createGroup", 201);
    // element is not focusable to use TypeText hence get click and type
    this.agHelper.GetNClick(RBAC.editName).type(groupname);
    this.agHelper.AssertContains(groupname);
  };

  /**
   * goto user, add  given user to the group
   */
  public AddUserToGroup = (groupName: string, userEmail: string) => {
    this.agHelper.GetNClick(this.usersTabInGroupPage);
    this.agHelper.GetNClick(RBAC.addUsersButton);
    this.agHelper.TypeText(RBAC.EmailInputInviteModal, userEmail);
    this.agHelper.PressEnter();
    this.agHelper.GetNClick(RBAC.inviteButton);
    this.assertHelper.AssertNetworkStatus("@inviteUser", 200);
    //this.agHelper.AssertContains("The user has been invited successfully");
  };

  /**
   * goto role, add  given role to the given group
   */
  public AddRoleToGroup = (groupName: string, role: string) => {
    this.agHelper.GetNClick(this.rolesTabInGroupPage);
    this.agHelper.GetNClick(this.rolesRow(role));
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@associateRoles", 200);
  };

  /**
   * Adds given default role to the group from group role page
   */
  public AddDefaultRoleGroup = (
    groupName: string,
    defaultRole: string,
    workspaceName: string | null = null,
  ) => {
    this.adminSettings.NavigateToAdminSettings();
    this.agHelper.GetNClick(RBAC.groupsTab);
    this.assertHelper.AssertNetworkStatus("@fetchGroups", 200);
    this.agHelper.TypeText(RBAC.searchBar, this.rolesRow(groupName));
    this.agHelper.GetNClick(this.rolesRow(groupName));
    this.agHelper.GetNClick(this.rolesTabInGroupPage);
    this.agHelper.GetNClick(this.defaultRoleToggle);
    const role = workspaceName
      ? defaultRole + " - " + workspaceName
      : defaultRole;
    this.agHelper.GetNClick(this.rolesRow(role));
    this.agHelper.GetNClick(RBAC.saveButton);
    this.assertHelper.AssertNetworkStatus("@associateRoles", 200);
  };

  /**
   * assert audit log text
   * params: entity, action
   */
  public AssertAuditLogText = (entity: string, action: string) => {
    this.agHelper.AssertElementExist(this.auditLogText(entity, action));
  };

  /**
   * function to role based intercept
   *
   */
  public RoleIntercepts = () => {
    cy.intercept("PUT", "/api/v1/roles/*").as("updateRoles");
    cy.intercept("GET", "/api/v1/roles").as("fetchRoles");
    cy.intercept("DELETE", "/api/v1/roles/*").as("deleteRole");
    cy.intercept("GET", "/api/v1/roles/assign").as("assignRole");
    cy.intercept("PUT", "/api/v1/roles/configure/*").as("saveRole");
    cy.intercept("PUT", "/api/v1/roles/*").as("renameRole");
    cy.intercept("GET", "/api/v1/roles/configure/*").as("editRole");
    cy.intercept("POST", "/api/v1/roles").as("createRole");
    cy.intercept("POST", "api/v1/user-groups").as("createGroup");
    cy.intercept("GET", "/api/v1/user-groups").as("fetchGroups");
    cy.intercept("PUT", "/api/v1/user-groups/*").as("renameGroup");
    cy.intercept("DELETE", "/api/v1/user-groups/*").as("deleteGroup");
    cy.intercept("POST", "api/v1/user-groups/invite", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("inviteUser");
    cy.intercept("DELETE", "api/v1/users/id/*").as("deleteUser");
    cy.intercept("PUT", "/api/v1/user-groups/*").as("updateGroup");
    cy.intercept("GET", "/api/v1/users/manage/all").as("fetchUsers");
    cy.intercept("PUT", "/api/v1/roles/associate", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("associateRoles");
    cy.intercept("GET", "/api/v1/user-groups/add-member").as("Members");
    cy.intercept("GET", "/api/v1/audit-logs/*").as("fetchAuditLogs");
    cy.intercept("POST", "/api/v1/user-groups/invite", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("mockPostInvite");
  };
}
