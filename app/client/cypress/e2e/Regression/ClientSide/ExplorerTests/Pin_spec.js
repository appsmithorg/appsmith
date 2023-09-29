import {
  agHelper,
  entityExplorer,
  locators,
  draggableWidgets,
  installer,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

const ExplorerMenu = {
  ADD_PAGE: "ADD_PAGE",
  ENTITY: "ENTITY",
  ADD_LIBRARY: "ADD_LIBRARY",
  ADD_QUERY_JS: "ADD_QUERY_JS",
};

const OpenExplorerMenu = (menu) => {
  switch (menu) {
    case ExplorerMenu.ADD_PAGE:
      agHelper.GetNClick(locators._newPage);
      cy.get(locators._canvas).trigger("mousemove", 500, 400, {
        force: true,
      });
      break;
    case ExplorerMenu.ENTITY:
      cy.xpath(entityExplorer._contextMenu("Page1"))
        .last()
        .click({ force: true });
      cy.get(locators._canvas).trigger("mousemove", 500, 400, {
        force: true,
      });
      break;
    case ExplorerMenu.ADD_QUERY_JS:
      cy.get(locators._createNew).last().click({ force: true });
      cy.get(locators._canvas).trigger("mousemove", 500, 300, {
        force: true,
      });
      break;
    case ExplorerMenu.ADD_LIBRARY:
      installer.OpenInstaller(true);
      cy.get(locators._canvas).trigger("mousemove", 500, 100, {
        force: true,
      });
      break;
    default:
  }
};

describe("Entity explorer tests related to pinning and unpinning", function () {
  before(() => {
    agHelper.AddDsl("displayWidgetDsl");
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
    entityExplorer.NavigateToSwitcher("Widgets");
    agHelper.ScrollTo(locators._widgetPane, "bottom");
    agHelper.AssertElementVisibility(
      locators._widgetPageIcon(draggableWidgets.VIDEO),
    );
    entityExplorer.PinUnpinEntityExplorer(true);
    agHelper.AssertElementVisibility(
      locators._widgetPageIcon(draggableWidgets.VIDEO),
    );
    entityExplorer.PinUnpinEntityExplorer(false);
    entityExplorer.NavigateToSwitcher("Explorer");
  });

  it(
    "excludeForAirgap",
    "3. Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
      entityExplorer.PinUnpinEntityExplorer(true);
      const menu = Object.keys(ExplorerMenu);

      Cypress._.times(menu.length, (index) => {
        OpenExplorerMenu(menu[index]);
        agHelper.Sleep();
        cy.get("[data-testid=sidebar-active]").should("exist");
      });

      // when an entity is being edited
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Edit name",
      });
      cy.get(locators._canvas).trigger("mousemove", 500, 400);
      agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
      entityExplorer.PinUnpinEntityExplorer(false);
    },
  );

  it(
    "airgap",
    "4. Unpinned explorer is to be open when any context menu is open or when an entity name is being edited",
    function () {
      agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
      entityExplorer.PinUnpinEntityExplorer(true);
      // We cannot add libraries on airgap
      const menu = Object.keys(ExplorerMenu).filter(
        (menu) => menu !== ExplorerMenu.ADD_LIBRARY,
      );

      Cypress._.times(menu.length, (index) => {
        OpenExplorerMenu(menu[index]);
        agHelper.Sleep();
        cy.get("[data-testid=sidebar-active]").should("exist");
      });

      // when an entity is being edited
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Edit name",
      });
      cy.get(locators._canvas).trigger("mousemove", 500, 400);
      agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
      entityExplorer.PinUnpinEntityExplorer(false);
    },
  );

  it("5. Explorer should be visible by default on a new application", function () {
    agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
    entityExplorer.PinUnpinEntityExplorer(true);
    agHelper.GetElement(locators._canvas).trigger("mousemove", 500, 100, {
      force: true,
    });
    agHelper
      .GetElement(entityExplorer._entityExplorer)
      .should("not.be.visible");
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.AssertElementVisibility(entityExplorer._entityExplorer);
  });
});
