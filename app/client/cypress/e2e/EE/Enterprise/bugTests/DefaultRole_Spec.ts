import {
  homePage,
  agHelper,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";

import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
let workspaceId: any, username: any;

describe(
  "Validates role assigned to user on providing access to workspace",
  { tags: ["@tag.AccessControl"] },
  function () {
    it("Bug: 21046: Default Role is not given to some users when multiple users are given roles through share modal.", function () {
      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        featureFlagIntercept({ license_gac_enabled: true });
        agHelper.Sleep(2000);
        workspaceId = uid;
        homePage.CreateNewWorkspace(workspaceId);
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        [
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTUSERNAME2"),
          Cypress.env("TESTUSERNAME3"),
          Cypress.env("TESTUSERNAME4"),
        ].forEach(function (user) {
          homePage.InviteUserToWorkspace(workspaceId, user, "Administrator");
          agHelper.WaitUntilAllToastsDisappear();
        });
        agHelper.GetNClick(homePage._closeBtn);
        adminSettings.NavigateToAdminSettings();
        agHelper.GetNClick(adminSettings._usersTab);
        agHelper.GetNAssertElementText(
          adminSettings._roles(Cypress.env("USERNAME")),
          "Instance Administrator Role",
          "contain.text",
        );
        [
          Cypress.env("TESTUSERNAME1").toLowerCase(),
          Cypress.env("TESTUSERNAME2").toLowerCase(),
          Cypress.env("TESTUSERNAME3").toLowerCase(),
          Cypress.env("TESTUSERNAME4").toLowerCase(),
        ].forEach(function (user) {
          agHelper.GetNAssertElementText(
            adminSettings._roles(user),
            "Administrator",
            "contain.text",
          );
          agHelper.GetNAssertElementText(
            adminSettings._roles(user),
            "Default Role For All Users",
            "contain.text",
          );
        });
      });
    });
  },
);
