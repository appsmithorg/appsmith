const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  deployMode,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe("Page Load tests", () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    cy.fixture("PageLoadDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    cy.CreatePage();
    cy.get("h2").contains("Drag and drop a widget here");
  });

  it("1. Published page loads correctly", () => {
    //add page within page
    cy.fixture("PageLoadDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    // Update the text to be asserted later
    cy.openPropertyPane("textwidget");
    cy.testCodeMirror("This is Page 2");
    // Publish
    deployMode.DeployApp();
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
    agHelper.RefreshPage(true, "viewPage");
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
    deployMode.NavigateBacktoEditor();
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Page1",
      action: "Hide",
    });
    deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
    cy.contains("Page2").should("not.exist");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Page2");
    deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    cy.contains("Page1").should("not.exist");
  });
});
