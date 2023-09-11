import {
  agHelper,
  locators,
  homePage,
  assertHelper,
  inviteModal,
} from "../../../../support/Objects/ObjectsCore";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

const timestamp = Date.now();

const MultipleDeleteFirstWorkspace = {
  workspaceName: `workspace_${timestamp}_1`,
  applicationName: `app_${timestamp}_1`,
};

const MultipleDeleteSecondWorkspace = {
  workspaceName: `workspace_${timestamp}_2`,
  applicationName: `app_${timestamp}_2`,
};

const UnableToDeleteWorkspace = {
  workspaceName: `workspace_${timestamp}_3`,
  applicationName: `app_${timestamp}_3`,
};

describe("Delete workspace test spec", function () {
  before(() => {
    homePage.CreateNewWorkspace(
      MultipleDeleteFirstWorkspace.workspaceName,
      true,
    );
    homePage.CreateAppInWorkspace(
      MultipleDeleteFirstWorkspace.workspaceName,
      MultipleDeleteFirstWorkspace.applicationName,
    );

    homePage.CreateNewWorkspace(
      MultipleDeleteSecondWorkspace.workspaceName,
      true,
    );
    homePage.CreateAppInWorkspace(
      MultipleDeleteSecondWorkspace.workspaceName,
      MultipleDeleteSecondWorkspace.applicationName,
    );
  });

  it("1. Should select & cancel delete multiple applications in different workspace", function () {
    homePage.NavigateToHome();
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteFirstWorkspace.applicationName,
    );
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteSecondWorkspace.applicationName,
    );
    agHelper.GetNClick(homePage._deleteMultipleAppCancelBtn);
    agHelper.AssertElementAbsence(homePage._multipleSelectedApplication);
  });

  it("2. Should select & delete multiple applications in different workspace", function () {
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteFirstWorkspace.applicationName,
    );
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteSecondWorkspace.applicationName,
    );
    agHelper.GetNClick(homePage._deleteMultipleAppBtn);
    agHelper.GetNClick(locators._confirmationdialogbtn("Yes"));
    assertHelper.WaitForNetworkCall("@deleteMultipleApp").then((intercept) => {
      expect(intercept.response?.body?.data?.length).to.be.equal(2);
    });
  });

  it("3. Unable to select to multiple delete if not enough permissions to delete", function () {
    homePage.CreateNewWorkspace(UnableToDeleteWorkspace.workspaceName, true);
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

    homePage.SelectMultipleApplicationToDelete(
      UnableToDeleteWorkspace.applicationName,
    );
    agHelper.ValidateToastMessage(
      "You don't have permission to delete this application",
    );
  });
});
