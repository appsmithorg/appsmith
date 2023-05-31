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
      [
        Cypress.env("TESTUSERNAME1").toLowerCase(),
        Cypress.env("TESTUSERNAME2").toLowerCase(),
        Cypress.env("TESTUSERNAME3").toLowerCase(),
        Cypress.env("TESTUSERNAME4").toLowerCase(),
      ].forEach(function (user) {
        _.agHelper.GetNAssertElementText(
          _.adminSettings._roles(user),
          "Administrator",
          "contain.text",
        );
        _.agHelper.GetNAssertElementText(
          _.adminSettings._roles(user),
          "Default Role For All Users",
          "contain.text",
        );
      });
    });
  });
});
