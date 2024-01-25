import {
  agHelper,
  homePage,
  assertHelper,
  inviteModal,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

const timestamp = Date.now();

const workspaceName = `w_${timestamp}`;
const firstApplicationName = `app_${timestamp}_1`;
const secondApplicationName = `app_${timestamp}_2`;

const UnableToDeleteWorkspace = {
  workspaceName: `w_${timestamp}_3`,
  applicationName: `app_${timestamp}_3`,
};

describe(
  "Delete multiple application",
  { tags: ["@tag.Workspace"] },
  function () {
    before(() => {
      homePage.CreateNewWorkspace(workspaceName, true);
      homePage.CreateAppInWorkspace(workspaceName, firstApplicationName);
      homePage.NavigateToHome();
      homePage.CreateAppInWorkspace(workspaceName, secondApplicationName);
    });

    it("1. Should select & cancel delete multiple applications in different workspace & other action items should not be visible when selection mode is on", function () {
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceName);

      homePage.SelectMultipleApplicationToDelete(firstApplicationName);
      homePage.SelectMultipleApplicationToDelete(secondApplicationName);

      // Asserting all the other share & create new app button not visible
      agHelper.AssertElementVisibility(homePage._newIcon, false);

      agHelper.AssertElementAbsence(homePage._newButtonCreateApplication);

      agHelper.ClickButton("Cancel");
      agHelper.AssertElementAbsence(homePage._multipleSelectedApplication);
      agHelper.AssertElementExist(homePage._appCard(firstApplicationName));
      agHelper.AssertElementExist(homePage._appCard(secondApplicationName));
    });

    it("2. Should select & delete multiple applications in different workspace", function () {
      homePage.SelectMultipleApplicationToDelete(firstApplicationName);
      homePage.SelectMultipleApplicationToDelete(secondApplicationName);
      agHelper.ClickButton("Delete");
      agHelper.ClickButton("Yes");
      assertHelper.WaitForNetworkCall("@deleteMultipleApp").then((response) => {
        expect(response?.body?.data?.length).to.be.equal(2);
        agHelper.AssertElementAbsence(homePage._appCard(firstApplicationName));
        agHelper.AssertElementAbsence(homePage._appCard(secondApplicationName));
      });
    });

    it("3. Unable to select to multiple delete if not enough permissions to delete", function () {
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      homePage.CreateNewWorkspace(UnableToDeleteWorkspace.workspaceName);
      homePage.CreateAppInWorkspace(
        UnableToDeleteWorkspace.workspaceName,
        UnableToDeleteWorkspace.applicationName,
      );

      agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      homePage.LogOutviaAPI();

      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );

      homePage.SelectWorkspace(UnableToDeleteWorkspace.workspaceName);

      homePage.SelectMultipleApplicationToDeleteByCard(
        UnableToDeleteWorkspace.applicationName,
        "topLeft",
      );
      agHelper.ValidateToastMessage(
        "You don't have permission to delete this application",
      );
    });
  },
);
