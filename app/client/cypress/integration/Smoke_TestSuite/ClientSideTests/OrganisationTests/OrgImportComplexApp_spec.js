const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Organization Import Application", function() {
  let orgid;
  let newOrganizationName;
  const fixtureDummyAppPath = "ImportApp.json";
  it("Can Import Application", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((createOrgInterception) => {
        newOrganizationName = createOrgInterception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.get(homePage.orgImportAppOption).click({ force: true });

        cy.get(homePage.orgImportAppModal).should("be.visible");
        cy.xpath(homePage.uploadLogo).attachFile(fixtureDummyAppPath);

        cy.get(homePage.orgImportAppButton).click({ force: true });
        cy.wait("@importNewApplication").then((interception) => {
          let appId = interception.response.body.data.id;
          let defaultPage = interception.response.body.data.pages.find(
            (eachPage) => !!eachPage.isDefault,
          );
          cy.get(homePage.toastMessage).should(
            "contain",
            "Application imported successfully",
          );
          cy.url().should(
            "include",
            `/applications/${appId}/pages/${defaultPage.id}/edit`,
          );
          cy.wait(5000);
          cy.wait("@getDataSources");
          cy.wait("@getActions");
          cy.wait("@getPage");
        });
      });
    });
  });

  it("Validate Imported Application in Edit mode", function() {
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "#1");

    cy.get(commonlocators.appname)
      .first()
      .invoke("attr", "value")
      .should("contain", "ImportApp");
  });

  it("Validate Imported Application in publish mode", function() {
    cy.PublishtheApp();
    cy.wait("@viewApp");
    cy.wait("@getPagesForViewApp");
    cy.wait("@getOrganisation");
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "#1");
    cy.get(publish.publishedAppName)
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("ImportApp");
      });
  });
});
