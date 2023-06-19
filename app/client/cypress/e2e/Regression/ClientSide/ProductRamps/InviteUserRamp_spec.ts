import * as _ from "../../../../support/Objects/ObjectsCore";
import homepageLocators from "../../../../locators/HomePage";

describe("Invite user ramp", function () {
  function checkRampText(val: "contain.text" | "not.have.text") {
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._inviteUserMessage,
      "Users will have access to all applications in the workspace. For application-level access, try out our",
      val,
    );
  }

  function appShareEditMode() {
    //visible in app share modal - EDIT mode
    _.inviteModal.OpenShareModal();
    checkRampText("contain.text");
    _.inviteModal.CloseModal();
  }

  function appShareViewMode() {
    //visible in app share modal - VIEW mode
    _.agHelper.GetNClick(_.locators._enterPreviewMode);
    _.agHelper.GetNClick(_.locators._viewModeShare);
    checkRampText("contain.text");
  }

  function workspaceShare(workspaceName?: any) {
    //should not visible in workspace share modal
    if (!workspaceName) {
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = uid;
        _.homePage.CreateNewWorkspace(workspaceName);
        _.agHelper.GetNClick(
          _.homePage._shareWorkspace(workspaceName),
          0,
          true,
        );
        checkRampText("not.have.text");
      });
    } else {
      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceName), 0, true);
      checkRampText("not.have.text");
    }
  }

  it("1. Ramp should be visible to ADMIN in app share modal and not in workspace share modal", () => {
    // checkInviteUserRamp();
    appShareEditMode();
    appShareViewMode();
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
    workspaceShare();
  });

  it("2. Ramp should be visible to DEVELOPER in app share modal and not in workspace share modal", () => {
    let workspaceName: any;
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.homePage.InviteUserToWorkspace(
        workspaceName,
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      cy.LogOut();
      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        let appName: any = uid;
        _.homePage.CreateAppInWorkspace(workspaceName, appName);
      });
      appShareEditMode();
      appShareViewMode();
      _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
      workspaceShare(workspaceName);
    });
  });
  it("3. Ramp should be visible to APP VIEWER in app share modal and not in workspace share modal", () => {
    let workspaceName: any;
    let appName: any;
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        appName = uid;
        _.homePage.CreateAppInWorkspace(workspaceName, appName);

        _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
        _.homePage.InviteUserToWorkspace(
          workspaceName,
          Cypress.env("TESTUSERNAME2"),
          "App Viewer",
        );
        cy.LogOut();
        cy.LogintoApp(
          Cypress.env("TESTUSERNAME2"),
          Cypress.env("TESTPASSWORD2"),
        );
        workspaceShare(workspaceName);
        _.homePage.FilterApplication(appName);
        _.agHelper.GetHoverNClick(
          homepageLocators.applicationBackgroundColor,
          0,
          true,
        );
        _.agHelper.GetNClick(homepageLocators.appView, 0, true);
        _.agHelper.GetNClick(_.locators._viewModeShare, 1000, true);
        checkRampText("contain.text");
      });
    });
  });
});
