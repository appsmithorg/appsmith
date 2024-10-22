import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  deployMode,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("Page Load tests", { tags: ["@tag.IDE", "@tag.PropertyPane"] }, () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    agHelper.AddDsl("PageLoadDsl");
    PageList.AddNewPage();
    cy.get("h2").contains(
      Cypress.env("MESSAGES").EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT(),
    );
  });

  it("1. Published page loads correctly", () => {
    //add page within page
    agHelper.AddDsl("PageLoadDsl");
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
    agHelper.RefreshPage("getConsolidatedData");
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
      entityType: EntityItems.Page,
    });
    deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
    cy.contains("Page2").should("not.exist");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
    deployMode.DeployApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    cy.contains("Page1").should("not.exist");
  });
});
