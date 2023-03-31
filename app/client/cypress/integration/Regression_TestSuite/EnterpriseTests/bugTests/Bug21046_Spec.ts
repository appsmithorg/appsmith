import * as _ from "../../../../support/Objects/ObjectsCore";
let workspaceId: any, username: any;

describe("Validates role assigned to user on providing access to workspace", function () {
  it("Bug: 21046: Default Role is not given to some users when multiple users are given roles through share modal.", function () {
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = uid;
      _.homePage.CreateNewWorkspace(workspaceId);
      _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      [
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTUSERNAME3"),
        Cypress.env("TESTUSERNAME4"),
      ].forEach(function (user) {
        _.homePage.InviteUserToWorkspace(workspaceId, user, "Administrator");
      });
      _.agHelper.GetNClick(_.homePage._closeBtn);
      _.adminSettings.NavigateToAdminSettings();
      _.agHelper.GetNClick(_.adminSettings._usersTab);
      _.agHelper.GetNAssertElementText(
        _.adminSettings._roles(Cypress.env("USERNAME")),
        "Instance Administrator Role",
        "contain.text",
      );
      _.agHelper.GetElement(".user-email-column").each(function ($user) {
        username = $user.text().slice(1);
        if (username != Cypress.env("USERNAME")) {
          _.agHelper.GetNAssertElementText(
            _.adminSettings._roles(username),
            "Administrator",
            "contain.text",
          );
          _.agHelper.GetNAssertElementText(
            _.adminSettings._roles(username),
            "Default Role For All Users",
            "contain.text",
          );
        }
      });
    });
  });
});
