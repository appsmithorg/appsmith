import {
  agHelper,
  homePage,
  assertHelper,
  inviteModal,
} from "../../../../support/Objects/ObjectsCore";

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

describe("Delete multiple application", function () {
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
    agHelper.ClickButton("Cancel");
    agHelper.AssertElementAbsence(homePage._multipleSelectedApplication);
    agHelper.AssertElementExist(
      homePage._appCard(MultipleDeleteFirstWorkspace.applicationName),
    );
    agHelper.AssertElementExist(
      homePage._appCard(MultipleDeleteSecondWorkspace.applicationName),
    );
  });

  it("2. Once the application is selected for multiple deletion, all the other buttons will be hidden once any application is selected)", function () {
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteFirstWorkspace.applicationName,
    );

    agHelper.AssertElementVisibility(
      homePage._shareWorkspace(MultipleDeleteFirstWorkspace.workspaceName),
      false,
    );

    agHelper.AssertElementVisibility(
      homePage._existingWorkspaceCreateNewApp(
        MultipleDeleteFirstWorkspace.workspaceName,
      ),
      false,
    );

    agHelper.ClickButton("Cancel");
  });

  it("3. Should select & delete multiple applications in different workspace", function () {
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteFirstWorkspace.applicationName,
    );
    homePage.SelectMultipleApplicationToDelete(
      MultipleDeleteSecondWorkspace.applicationName,
    );
    agHelper.ClickButton("Delete");
    agHelper.ClickButton("Yes");
    assertHelper.WaitForNetworkCall("@deleteMultipleApp").then((intercept) => {
      expect(intercept.response?.body?.data?.length).to.be.equal(2);
      agHelper.AssertElementAbsence(
        homePage._appCard(MultipleDeleteFirstWorkspace.applicationName),
      );
      agHelper.AssertElementAbsence(
        homePage._appCard(MultipleDeleteSecondWorkspace.applicationName),
      );
    });
  });

  it("4. Unable to select to multiple delete if not enough permissions to delete", function () {
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

    homePage.SelectMultipleApplicationToDelete(
      UnableToDeleteWorkspace.applicationName,
    );
    agHelper.ValidateToastMessage(
      "You don't have permission to delete this application",
    );
  });
});
