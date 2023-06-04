const dsl = require("../../../../fixtures/PageLoadDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Page Load tests", () => {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dsl);
    cy.CreatePage();
    cy.get("h2").contains("Drag and drop a widget here");
  });

  it("1. Published page loads correctly", () => {
    //add page within page
    cy.addDsl(dsl);
    // Update the text to be asserted later
    cy.openPropertyPane("textwidget");
    cy.testCodeMirror("This is Page 2");
    // Publish
    _.deployMode.DeployApp();
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    // Test after reload
    _.agHelper.RefreshPage(true, false);
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    // Switch page
    cy.get(".t--page-switch-tab").contains("Page1").click({ force: true });
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page1")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
  });

  it("2. Hide Page and validate published app", () => {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ActionContextMenuByEntityName("Page1", "Hide");
    _.deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
    cy.contains("Page2").should("not.exist");
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("Page2");
    _.deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    cy.contains("Page1").should("not.exist");
  });
});
