const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const dsl = require("../../../../fixtures/previewMode.json");

describe("Preview mode functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks preview mode interactions", function() {
    cy.get(".t--switch-preview-mode-toggle").click();
  });
});
