const dsl = require("../../../../fixtures/displayWidgetDsl.json");
import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  library = ObjectsRegistry.LibraryInstaller;

const ExplorerMenu = {
  ADD_PAGE: "ADD_PAGE",
  ENTITY: "ENTITY",
  ADD_QUERY_JS: "ADD_QUERY_JS",
  ADD_LIBRARY: "ADD_LIBRARY",
};

const OpenExplorerMenu = (menu) => {
  switch (menu) {
    case ExplorerMenu.ADD_PAGE:
      agHelper.GetNClick(ee.locator._newPage);
      cy.get(locator._canvas).trigger("mousemove", 500, 400);
      break;
    case ExplorerMenu.ENTITY:
      cy.xpath(ee._contextMenu("Page1")).last().click({ force: true });
      cy.get(locator._canvas).trigger("mousemove", 500, 400);
      break;
    case ExplorerMenu.ADD_QUERY_JS:
      cy.get(ee.locator._createNew).last().click({ force: true });
      cy.get(locator._canvas).trigger("mousemove", 500, 300);
      break;
    case ExplorerMenu.ADD_LIBRARY:
      library.openInstaller();
      cy.get(locator._canvas).trigger("mousemove", 500, 100);
      break;
    default:
  }
};

describe("Entity explorer tests related to pinning and unpinning", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks entity explorer visibility on unpin", function () {
    cy.wait(5000);
    cy.get(".t--entity-explorer").should("be.visible");
    cy.get(".t--pin-entity-explorer").click();
    cy.wait(5000);
    cy.get("[data-testid=widgets-editor]").click({ force: true });
    cy.wait(3000);
    cy.get(".t--entity-explorer").should("not.be.visible");
  });

  it("checks entity explorer visibility on pin", function () {
    cy.get(".t--pin-entity-explorer").click();
    cy.get(".t--entity-explorer").should("be.visible");
  });

  it("Widgets visibility in widget pane", function () {
    ee.NavigateToSwitcher("widgets");
    agHelper.ScrollTo(locator._widgetPane, "bottom");
    agHelper.AssertElementVisible(ee.locator._widgetPageIcon(WIDGET.VIDEO));
    ee.PinUnpinEntityExplorer(true);
    agHelper.AssertElementVisible(ee.locator._widgetPageIcon(WIDGET.VIDEO));
    ee.PinUnpinEntityExplorer(false);
    ee.NavigateToSwitcher("explorer");
  });

  it(
    "excludeForAirgap",
    "Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      agHelper.AssertElementVisible(ee._entityExplorer);
      ee.PinUnpinEntityExplorer(true);
      const menu = Object.keys(ExplorerMenu);

      Cypress._.times(menu.length, (index) => {
        OpenExplorerMenu(menu[index]);
        agHelper.Sleep();
        agHelper.AssertElementVisible(ee._entityExplorer);
      });

      // when an entity is being edited
      ee.ActionContextMenuByEntityName("Page1", "Edit Name");
      cy.get(locator._canvas).trigger("mousemove", 500, 400);
      agHelper.AssertElementVisible(ee._entityExplorer);
    },
  );

  it(
    "airgap",
    "Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      agHelper.AssertElementVisible(ee._entityExplorer);
      ee.PinUnpinEntityExplorer(true);
      const menu = Object.keys(ExplorerMenu);

      Cypress._.times(menu.length - 1, (index) => {
        OpenExplorerMenu(menu[index]);
        agHelper.Sleep();
        agHelper.AssertElementVisible(ee._entityExplorer);
      });

      // when an entity is being edited
      ee.ActionContextMenuByEntityName("Page1", "Edit Name");
      cy.get(locator._canvas).trigger("mousemove", 500, 400);
      agHelper.AssertElementVisible(ee._entityExplorer);
    },
  );
});
