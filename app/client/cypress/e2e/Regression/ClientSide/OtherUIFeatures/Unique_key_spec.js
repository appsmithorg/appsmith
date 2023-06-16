const explorer = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

// Since we cannot test the root cause as it does not show up on the DOM, we are testing the sideEffects
// the root cause is when widget has same keys, which are not visible in DOM but confuses React when the list is modified.
// please refer to issue, https://github.com/appsmithorg/appsmith/issues/7415 for more details.
describe("Unique react keys", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.fixture("basicDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Should not create duplicate versions of widget on drop from explorer", function () {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("chartwidget", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("selectwidget", { x: 200, y: 600 });
    cy.dragAndDropToCanvas("selectwidget", { x: 200, y: 700 });

    entityExplorer.SelectEntityByName("Chart1");
    cy.deleteWidget(widgetsPage.chartWidget);

    cy.get(widgetsPage.selectwidget).should("have.length", 2);
  });

  it("2. Should not create duplicate versions of widget on widget copy", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("chartwidget", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("selectwidget", { x: 200, y: 600 });
    //copy and paste
    entityExplorer.SelectEntityByName("Select1");

    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(widgetsPage.selectwidget).should("have.length", 2);

    entityExplorer.SelectEntityByName("Chart1");
    cy.deleteWidget(widgetsPage.chartWidget);

    cy.get(widgetsPage.selectwidget).should("have.length", 2);
  });
});
