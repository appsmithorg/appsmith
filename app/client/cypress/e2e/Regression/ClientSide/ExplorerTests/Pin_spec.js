import { WIDGET } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

const ExplorerMenu = {
  ADD_PAGE: "ADD_PAGE",
  ENTITY: "ENTITY",
  ADD_QUERY_JS: "ADD_QUERY_JS",
  ADD_LIBRARY: "ADD_LIBRARY",
};

const OpenExplorerMenu = (menu) => {
  switch (menu) {
    case ExplorerMenu.ADD_PAGE:
      _.agHelper.GetNClick(_.entityExplorer._.locators._newPage);
      cy.get(_.locators._canvas).trigger("mousemove", 500, 400, {
        force: true,
      });
      break;
    case ExplorerMenu.ENTITY:
      cy.xpath(_.entityExplorer._contextMenu("Page1"))
        .last()
        .click({ force: true });
      cy.get(_.locators._canvas).trigger("mousemove", 500, 400, {
        force: true,
      });
      break;
    case ExplorerMenu.ADD_QUERY_JS:
      cy.get(_.entityExplorer._.locators._createNew)
        .last()
        .click({ force: true });
      cy.get(_.locators._canvas).trigger("mousemove", 500, 300, {
        force: true,
      });
      break;
    case ExplorerMenu.ADD_LIBRARY:
      _.library.openInstaller(true);
      cy.get(_.locators._canvas).trigger("mousemove", 500, 100, {
        force: true,
      });
      break;
    default:
  }
};

describe("Entity explorer tests related to pinning and unpinning", function () {
  before(() => {
    cy.fixture("displayWidgetDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. checks entity explorer visibility on unpin", function () {
    cy.wait(5000);
    cy.get(".t--entity-explorer").should("be.visible");
    cy.get(".t--pin-entity-explorer").click();
    cy.wait(5000);
    cy.get("[data-testid=widgets-editor]").click({ force: true });
    cy.wait(3000);
    cy.get(".t--entity-explorer").should("not.be.visible");
    //checks entity explorer visibility on pin
    cy.get(".t--pin-entity-explorer").click();
    cy.get(".t--entity-explorer").should("be.visible");
  });

  it("2. Widgets visibility in widget pane", function () {
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.agHelper.ScrollTo(_.locators._widgetPane, "bottom");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._.locators._widgetPageIcon(WIDGET.VIDEO),
    );
    _.entityExplorer.PinUnpinEntityExplorer(true);
    _.agHelper.AssertElementVisible(
      _.entityExplorer._.locators._widgetPageIcon(WIDGET.VIDEO),
    );
    _.entityExplorer.PinUnpinEntityExplorer(false);
    _.entityExplorer.NavigateToSwitcher("Explorer");
  });

  it(
    "excludeForAirgap",
    "3. Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      _.agHelper.AssertElementVisible(_.entityExplorer._entityExplorer);
      _.entityExplorer.PinUnpinEntityExplorer(true);
      const menu = Object.keys(ExplorerMenu);

      Cypress._.times(menu.length, (index) => {
        OpenExplorerMenu(menu[index]);
        _.agHelper.Sleep();
        cy.get("[data-testid=sidebar-active]").should("exist");
      });

      // when an entity is being edited
      _.entityExplorer.ActionContextMenuByEntityName("Page1", "Edit name");
      cy.get(_.locators._canvas).trigger("mousemove", 500, 400);
      _.agHelper.AssertElementVisible(_.entityExplorer._entityExplorer);
    },
  );

  it(
    "airgap",
    "4. Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      _.agHelper.AssertElementVisible(_.entityExplorer._entityExplorer);
      _.entityExplorer.PinUnpinEntityExplorer(true);
      const menu = Object.keys(ExplorerMenu);

      Cypress._.times(menu.length - 1, (index) => {
        OpenExplorerMenu(menu[index]);
        _.agHelper.Sleep();
        cy.get("[data-testid=sidebar-active]").should("exist");
      });

      // when an entity is being edited
      _.entityExplorer.ActionContextMenuByEntityName("Page1", "Edit name");
      cy.get(_.locators._canvas).trigger("mousemove", 500, 400);
      _.agHelper.AssertElementVisible(_.entityExplorer._entityExplorer);
    },
  );
});
