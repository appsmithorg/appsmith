import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Update Workspace", { tags: ["@tag.Workspace", "@tag.AccessControl"] }, function () {
  let workspaceId;
  let newWorkspaceName;
  let appid;

  it("1. Open the workspace general settings and update workspace name. The update should reflect in the workspace. It should also reflect in the workspace names on the left side and the workspace dropdown.	", function () {
    _.homePage.NavigateToHome();
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      appid = "App" + uid;
      workspaceId = uid;
      _.homePage.CreateNewWorkspace(workspaceId);
      cy.get(homePage.workspaceSettingOption).click({ force: true });
      //_.homePage.CreateAppInWorkspace(workspaceId, appid);
      cy.get(homePage.workspaceNameInput).click({ force: true });
      cy.get(homePage.workspaceNameInput).clear();
      cy.get(homePage.workspaceNameInput).type(workspaceId);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(homePage.workspaceHeaderName).should(
        "have.text",
        `${workspaceId}`,
      );

      _.homePage.NavigateToHome();
      cy.get(homePage.leftPanelContainer).within(() => {
        cy.get("span").should((item) => {
          expect(item).to.contain.text(workspaceId);
        });
      });
    });
  });

  it("2. Open the workspace general settings and update workspace email. The update should reflect in the workspace.", function () {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = "SettingsUpdate" + uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
    });
    cy.get(homePage.workspaceSettingOption).click({ force: true });
    cy.get(homePage.workspaceEmailInput).clear();
    cy.get(homePage.workspaceEmailInput).type(Cypress.env("TESTUSERNAME2"));
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceEmailInput).should(
      "have.value",
      Cypress.env("TESTUSERNAME2"),
    );
    // update workspace website
    cy.get(homePage.workspaceWebsiteInput).clear();
    cy.get(homePage.workspaceWebsiteInput).type("demowebsite.com");
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceWebsiteInput).should(
      "have.value",
      "demowebsite.com",
    );
  });

  it("3. Upload logo / delete logo and validate", function () {
    const fixturePath = "cypress/fixtures/appsmithlogo.png";
    cy.xpath(homePage.uploadLogo).first().selectFile(fixturePath, {
      force: true,
    });
    cy.wait("@updateLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(homePage.removeLogo)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.wait("@deleteLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
