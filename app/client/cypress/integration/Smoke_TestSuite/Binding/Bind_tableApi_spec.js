const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const apiPage = require("../../../locators/ApiEditor.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  let apiData;
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add users api and execute api", function() {
    cy.createAndFillApi(this.data.userApi, "/users");
    cy.RunAPI();
    cy.get(apiPage.responseBody)
      .contains("name")
      .siblings("span")
      .invoke("text")
      .then(text => {
        const value = text.match(/"(.*)"/)[0];
        cy.log(value);

        apiData = value;
        cy.log("val1:" + value);
      });
  });

  it("Test_Validate the Api data is updated on Table widget", function() {
    cy.get(pages.pagesIcon).click({ force: true });
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", "{{Api1.data}}");
    cy.get(commonlocators.editPropCrossButton).click();

    /**
     * readTabledata--> is to read the table contents
     * @param --> "row num" and "col num"
     */
    cy.readTabledata("0", "1").then(tabData => {
      expect(apiData).to.eq(`\"${tabData}\"`);
    });
    cy.PublishtheApp();
    cy.readTabledataPublish("0", "1").then(tabData => {
      expect(apiData).to.eq(`\"${tabData}\"`);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
