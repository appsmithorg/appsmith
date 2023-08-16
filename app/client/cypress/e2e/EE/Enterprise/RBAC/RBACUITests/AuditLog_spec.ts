import {
  homePage,
  agHelper,
  adminSettings,
  entityExplorer,
  dataSources,
  assertHelper,
  rbacHelper,
  fakerHelper,
} from "../../../../../support/ee/ObjectsCore_EE";

import auditlogloc from "../../../../../locators/AuditLogsLocators";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";

describe("Checking audit logs permission", function () {
  let workspaceName: string, appName: string, datasourceName;
  const pageName = "page_no_permission" + fakerHelper.GetRandomNumber();
  const permissionAtPageLevel =
    "PagePermissionRule" + fakerHelper.GetRandomNumber();
  const queryName = "GetProduct" + fakerHelper.GetRandomNumber();
  /**
   * Create a workspace, app with 2 pages
   */
  beforeEach(() => {
    rbacHelper.RoleIntercepts();
  });

  /**
   * Creates a workspace
   * In the workspace creates an app
   * Creates 2 pages in the page and renames Page 2 to page_no_permission
   * Creates a datasource - Postgres
   * Adds a query to the datasource
   * Runs and checks the query
   * Creates a role with access to Page 1
   * Adds audit log permission to the role
   * Assigns the role to the test user 1
   */
  before(() => {
    rbacHelper.RoleIntercepts();
    agHelper.GenerateUUID();
    // get the guid from the alias and assign it to the workspace name
    cy.get("@guid").then((guid) => {
      workspaceName = "workspace" + guid;
      appName = "app" + guid;
      homePage.CreateNewWorkspace(workspaceName, true);
      homePage.CreateAppInWorkspace(workspaceName, appName);
      entityExplorer.AddNewPage("New blank page").then((newPage) => {
        entityExplorer.RenameEntityFromExplorer(newPage, pageName, true);
      });
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM public.astronauts LIMIT 10;",
        queryName,
      );
      dataSources.RunQuery();
      adminSettings.NavigateToAdminSettings();
      rbacHelper.CreatePermissionPageLevel(
        permissionAtPageLevel,
        workspaceName,
        appName,
        "Page1",
      );
    });

    rbacHelper.AddAuditLogViewPermission(permissionAtPageLevel);
    rbacHelper.AssignRoleToUser(
      permissionAtPageLevel,
      Cypress.env("TESTUSERNAME1"),
    );
    adminSettings.NavigateToAdminSettings();
  });

  /**
   * workspacename updated
   * Page1 created
   * appname updated
   * Page 2 created
   * postgress datasource created
   * Query1 created
   * queryname updated
   * pagepermissionrule updated
   */
  it("1. Check audit logs for above actions - instance admin", function () {
    adminSettings.NavigateToAdminSettings();
    agHelper.GetNClick(auditlogloc.LeftPaneAuditLogsLink);

    featureFlagIntercept({ license_audit_logs_enabled: true });

    agHelper.GetNClick(auditlogloc.DateFilterContainer);
    agHelper.GetNClick(auditlogloc.datePickerToday);
    rbacHelper.AssertAuditLogText(workspaceName, "updated");
    rbacHelper.AssertAuditLogText("Page1", "created");
    rbacHelper.AssertAuditLogText(appName, "updated");
    rbacHelper.AssertAuditLogText("Page2", "created");
    rbacHelper.AssertAuditLogText(datasourceName, "created");
    rbacHelper.AssertAuditLogText("Query1", "created");
    rbacHelper.AssertAuditLogText(queryName, "updated");
    rbacHelper.AssertAuditLogText(permissionAtPageLevel, "updated");
  });

  it("2. Add audit log view permission  for test user 1 and check the logs", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    agHelper.GetNClick(adminSettings._adminSettingsBtn);
    featureFlagIntercept({ license_audit_logs_enabled: true });
    cy.wait(2000);
    assertHelper.AssertNetworkStatus("@fetchAuditLogs", 200);
    agHelper.GetNClick(auditlogloc.RefreshButton);
    featureFlagIntercept({ license_audit_logs_enabled: true });
    cy.wait(2000);
    assertHelper.AssertNetworkStatus("@fetchAuditLogs", 200);
    agHelper.GetNClick(auditlogloc.DateFilterContainer);
    agHelper.GetNClick(auditlogloc.datePickerToday);

    rbacHelper.AssertAuditLogText(
      Cypress.env("TESTUSERNAME1").replace(".com", ""),
      "associated",
    );
    agHelper.AssertContains("to " + permissionAtPageLevel);
  });
});
