const { ObjectsRegistry } = require("../../../../../support/Objects/Registry");

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;
const page1 = "Page1";

describe("Iframe Widget functionality", function() {
  before(function() {
    agHelper.ClearLocalStorageCache();
  });

  beforeEach(function() {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(function() {
    agHelper.SaveLocalStorageCache();
  });

  it("1.Import application json", function() {
    cy.visit("/applications");
    homePage.ImportApp("IframeOnSrcDocChange.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        homePage.AssertImportToast();
      }
    });
  });

  it("2.Check the OnSrcDocChange event call on first render", () => {
    cy.reload();
    cy.wait(2000);
    cy.get(`.t--entity .page`)
      .first()
      .should("have.class", "activePage");
    cy.openPropertyPane("iframewidget");
    cy.testJsontext("srcdoc", "<h1>Hello World!</h1>");
    cy.wait(2000);
    cy.get(`.t--entity .page`)
      .last()
      .should("have.class", "activePage");
    cy.get(`.t--entity-name:contains(${page1})`)
      .first()
      .click();
    cy.get(`.t--entity .page`)
      .first()
      .should("have.class", "activePage");
  });
});
