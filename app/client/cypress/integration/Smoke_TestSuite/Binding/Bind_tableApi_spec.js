const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const apiPage = require("../../../locators/ApiEditor.json");
let apiData;

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add users api and execute api", function() {
    cy.NavigateToApiEditor();
    cy.testCreateApiButton();
    cy.createApi(this.data.userApi, "users");
    cy.get(apiPage.responseBody)
      .contains("name")
      .siblings("span")
      .invoke("text")
      .then(text => {
        cy.log(text);
        apiData = text;
        cy.log("val1:" + apiData);
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
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
