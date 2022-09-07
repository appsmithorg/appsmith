import homePage from "../../../../locators/HomePage";

describe("Update Workspace", function() {
  let workspaceId;
  let newWorkspaceName;

  it("Open the workspace general settings and update workspace name. The update should reflect in the workspace. It should also reflect in the workspace names on the left side and the workspace dropdown.	", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
        cy.get(homePage.workspaceSettingOption).click({ force: true });
      });
    });
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.get(homePage.workspaceNameInput).click({ force: true });
      cy.get(homePage.workspaceNameInput).clear();
      cy.get(homePage.workspaceNameInput).type(workspaceId);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(homePage.workspaceHeaderName).should("have.text", workspaceId);
    });
    cy.NavigateToHome();
    cy.get(homePage.leftPanelContainer).within(() => {
      cy.get("span").should((item) => {
        expect(item).to.contain.text(workspaceId);
      });
    });
  });

  it("Open the workspace general settings and update workspace email. The update should reflect in the workspace.", function() {
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.renameWorkspace(newWorkspaceName, workspaceId);
      cy.get(homePage.workspaceSettingOption).click({ force: true });
    });
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
  });

  it("Upload logo / delete logo and validate", function() {
    const fixturePath = "appsmithlogo.png";
    cy.xpath(homePage.uploadLogo).attachFile(fixturePath);
    cy.wait("@updateLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(homePage.membersTab).click({ force: true });
    cy.xpath(homePage.generalTab).click({ force: true });
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

  it("Open the workspace general settings and update workspace website. The update should reflect in the workspace.", function() {
    cy.get(homePage.workspaceWebsiteInput).clear();
    cy.get(homePage.workspaceWebsiteInput).type("demowebsite");
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceWebsiteInput).should("have.value", "demowebsite");
  });
});
