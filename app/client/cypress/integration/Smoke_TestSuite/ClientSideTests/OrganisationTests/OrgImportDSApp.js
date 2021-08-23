const queryLocators = require("../../../../locators/QueryEditor.json");
const plugins = require("../../../../fixtures/plugins.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const homePage = require("../../../../locators/HomePage.json");

let datasourceName;
let orgid;
let newOrganizationName;
let appname;

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a query with a mongo datasource, run, save and then delete the query", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillMongoDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.contains(".t--datasource-name", datasourceName)
        .find(queryLocators.createQuery)
        .click();
    });

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Raw")]').click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`{"find": "listingsAndReviews","limit": 10}`, {
        parseSpecialCharSequences: false,
      });

    cy.EvaluateCurrentValue(`{"find": "listingsAndReviews","limit": 10}`);
    cy.get(".editable-application-name span")
      .invoke("text")
      .then((text) => {
        appname = text;
      });
  });

  it("Can Import Application", function() {
    cy.NavigateToHome();
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

  it("Run Query and delete datasource in the newly imported App", function() {
    cy.NavigateToDatasourceEditor();
    cy.SearchEntityandOpen("Query1");
    cy.runAndDeleteQuery();
  });
});
