const dsl = require("../../../../fixtures/DocumentViewerDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("DocumentViewer Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Add new DocumentViewer", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("documentviewerwidget", { x: 300, y: 300 });
    cy.get(".t--widget-documentviewerwidget").should("exist");
  });

  it("Open Existing DocumentViewer from Widgets list", () => {
    cy.get(".t--widget-documentviewerwidget").should("exist");
  });
});
