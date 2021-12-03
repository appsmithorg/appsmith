const homePage = require("../../../../locators/HomePage.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");

describe("Organization Import Application", function() {
  let orgid;
  let newOrganizationName;
  let appname;

  before(() => {
    cy.addDsl(dsl);
  });

  it("Can Import Application", function() {
    cy.NavigateToHome();
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.searchInput).clear();
    cy.get(`a[id=t--export-app-link]`).then((anchor) => {
      const url = anchor.prop("href");
      cy.request(url).then(({ body, headers }) => {
        expect(headers).to.have.property("content-type", "application/json");
        expect(headers).to.have.property(
          "content-disposition",
          `attachment; filename*=UTF-8''${appname}.json`,
        );
        cy.writeFile("cypress/fixtures/exported-app.json", body, "utf-8");

        cy.generateUUID().then((uid) => {
          orgid = uid;
          localStorage.setItem("OrgName", orgid);
          cy.createOrg();
          cy.wait("@createOrg").then((createOrgInterception) => {
            newOrganizationName = createOrgInterception.response.body.data.name;
            cy.renameOrg(newOrganizationName, orgid);
            cy.get(homePage.orgImportAppOption).click({ force: true });

            cy.get(homePage.orgImportAppModal).should("be.visible");
            cy.xpath(homePage.uploadLogo).attachFile("exported-app.json");

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
            });
          });
        });
      });
    });
  });
});
