const homePage = require("../../../../locators/HomePage.json");

describe("Update Organization", function() {
  let orgid;
  let newOrganizationName;

  it("Open the org general settings and update org name. The update should reflect in the org. It should also reflect in the org names on the left side and the org dropdown.	", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.get(homePage.orgSettingOption).click({ force: true });
      });
    });
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.get(homePage.orgNameInput).click({ force: true });
      cy.get(homePage.orgNameInput).clear();
      cy.get(homePage.orgNameInput).type(orgid);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(homePage.orgHeaderName).should("have.text", orgid);
    });
    cy.NavigateToHome();
    cy.get(homePage.leftPanelContainer).within(() => {
      cy.get("span").should((item) => {
        expect(item).to.contain.text(orgid);
      });
    });
  });

  it("Open the org general settings and update org email. The update should reflect in the org.", function() {
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      cy.renameOrg(newOrganizationName, orgid);
      cy.get(homePage.orgSettingOption).click({ force: true });
    });
    cy.get(homePage.orgEmailInput).clear();
    cy.get(homePage.orgEmailInput).type(Cypress.env("TESTUSERNAME2"));
    cy.wait("@updateOrganization").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.orgEmailInput).should(
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

  it("Open the org general settings and update org website. The update should reflect in the org.", function() {
    cy.get(homePage.orgWebsiteInput).clear();
    cy.get(homePage.orgWebsiteInput).type("demowebsite");
    cy.wait("@updateOrganization").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.orgWebsiteInput).should("have.value", "demowebsite");
  });
});
