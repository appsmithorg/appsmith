import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Help Button on editor", function () {
  function checkInviteUserRamp() {
    //visible in app share modal
    _.inviteModal.OpenShareModal();
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._inviteUserMessage,
      "Users will have access to all applications in the workspace. For application-level access, try out our",
      "contain.text",
    );
    _.inviteModal.CloseModal();
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);

    //should not visible in workspace share modal
    let workspaceName: any;
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceName), 0, true);
    });
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._inviteUserMessage,
      "Users will have access to all applications in the workspace. For application-level access, try out our",
      "not.have.text",
    );
  }
  it("1. Invite user to app ramp should be visible to admin in app share modal and not in workspace share modal", () => {
    checkInviteUserRamp();
  });

  it("2. Invite user to app ramp should be visible to developer in app share modal and not in workspace share modal", () => {
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
    });
    cy.LogOut();
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    checkInviteUserRamp();
  });
});
