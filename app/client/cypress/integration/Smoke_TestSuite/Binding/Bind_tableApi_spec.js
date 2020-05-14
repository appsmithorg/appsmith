const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
let apiData;

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.server();
    cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");
  });

  it("Test Add users api api and execute api", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.testCreateApiButton();
    cy.createApi("http://postgrest.appsmith.com:3000", "users");
    cy.get(".CodeMirror-code  span.cm-string.cm-property")
      .contains("name")
      .siblings("span")
      .invoke("text")
      .then(text => {
        cy.log(text);
        apiData = text;
        cy.log("val1:" + apiData);
      });
  });

  it("Bind the User Api to Table widget", function() {
    // cy.log(value)
    cy.get(pages.pagesIcon).click({ force: true });
    cy.openPropertyPane("tablewidget");
    cy.testCodeMirror("{{Api1.data}}");
    cy.wait("@updateLayout");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledata("0", "1").then(tabData => {
      expect(apiData).to.eq(`\"${tabData}\"`);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
